import { dehydrate, QueryClient } from "@tanstack/react-query";
import type { HelmetData } from "@zudoku/react-helmet-async";
import { Hono } from "hono";
import { compress } from "hono/compress";
import logger from "loglevel";
import { renderToReadableStream, renderToStaticMarkup } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  isRouteErrorResponse,
  type RouteObject,
} from "react-router";
import "vite/modulepreload-polyfill";
import { configuredAuthProvider } from "virtual:zudoku-auth";
import config from "virtual:zudoku-config";
import { parseCookies } from "../lib/authentication/cookies.js";
import { createSessionHandler } from "../lib/authentication/session-handler.js";
import { cachedVerifyAccessToken } from "../lib/authentication/verify-cache.js";
import { BootstrapStatic } from "../lib/components/Bootstrap.js";
import { NO_DEHYDRATE } from "../lib/components/cache.js";
import type { SSRAuthState } from "../lib/components/context/RenderContext.js";
import { ServerError } from "../lib/errors/ServerError.js";
import { highlighterPromise } from "../lib/shiki.js";
import { getRoutesByConfig } from "./main.js";
import { protectChunks as rawProtectChunks } from "./protectChunks.js";
import { wrapProtectedRoutes } from "./wrapProtectedRoutes.js";
export { getRoutesByConfig };

// Shared cached verifier for all consumers (session handler, SSR render, protected-chunk gate). Callers just use the function; cache logic is hidden here.
const verifier = configuredAuthProvider?.verifyAccessToken
  ? (token: string) =>
      cachedVerifyAccessToken(
        // biome-ignore lint/style/noNonNullAssertion: verifyAccessToken is guaranteed to be defined
        configuredAuthProvider!.verifyAccessToken!.bind(configuredAuthProvider),
        token,
      )
  : undefined;

// Wire verifier here so adapters remain auth-agnostic.
export const protectChunks: typeof rawProtectChunks = (opts) =>
  rawProtectChunks({
    ...opts,
    verifyAccessToken: opts.verifyAccessToken ?? verifier,
  });

const safeSerialize = (data: unknown) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

// Statically importing shiki.ts here ensures it's in the SSR bundle.
// main.tsx dynamically imports it instead to enable lazy loading on the client.
await import("virtual:zudoku-shiki-register").then(
  async ({ registerShiki }) => {
    const highlighter = await highlighterPromise;
    await registerShiki(highlighter);
  },
);
export const handleRequest = async ({
  template,
  request,
  routes,
  basePath,
  bypassProtection,
}: {
  template: string;
  request: Request;
  routes: RouteObject[];
  basePath?: string;
  bypassProtection?: boolean;
}): Promise<Response> => {
  const { accessToken } = parseCookies(request);
  // Always derive profile from the verifier, never trust the client cookie.
  // An unverified profile would let a stale/forged cookie render protected HTML.
  let verifiedProfile: SSRAuthState["profile"] = null;
  if (accessToken && verifier) {
    try {
      const verified = await verifier(accessToken);
      if (verified) verifiedProfile = verified.profile;
    } catch (error) {
      logger.error(
        `SSR auth verifier error (${request.method} ${request.url}):`,
        error,
      );
    }
  }
  const ssrAuth: SSRAuthState | undefined = configuredAuthProvider
    ? {
        accessToken: verifiedProfile ? accessToken : undefined,
        profile: verifiedProfile,
      }
    : undefined;

  // No-op lazy() on protected subtrees for unauthed requests so loaders
  // don't run for a 401 render.
  const url = new URL(request.url);
  const effectiveRoutes = wrapProtectedRoutes(
    routes,
    config.protectedRoutes,
    url.pathname,
    !!ssrAuth?.profile,
    basePath,
  );

  const { query, dataRoutes } = createStaticHandler(effectiveRoutes, {
    basename: basePath,
  });
  const queryClient = new QueryClient();

  const context = await query(request);

  if (context instanceof Response) {
    if ([301, 302, 303, 307, 308].includes(context.status)) {
      return new Response(null, {
        status: context.status,
        headers: { Location: context.headers.get("Location") ?? "" },
      });
    }
    throw context;
  }

  let status = 200;
  if (context.errors) {
    const firstError = Object.values(context.errors).find(isRouteErrorResponse);
    if (firstError?.status) {
      status = firstError.status;
    }
  }

  const router = createStaticRouter(dataRoutes, context);
  const helmetContext = {} as HelmetData["context"];
  const renderContext = {
    status: 200,
    bypassProtection: bypassProtection ?? false,
    ssrAuth,
  };

  const App = (
    <BootstrapStatic
      router={router}
      context={context}
      queryClient={queryClient}
      helmetContext={helmetContext}
      bypassProtection={bypassProtection}
      renderContext={renderContext}
    />
  );

  try {
    const reactStream = await renderToReadableStream(App, {
      onError(error) {
        status = 500;
        logger.error(`SSR Error (${request.method} ${request.url}):`, error);
      },
    });

    await reactStream.allReady;

    const [htmlStart, htmlEnd] = template.split("<!--app-html-->");
    if (!htmlStart) {
      throw new Error("No <!--app-html--> found in template");
    }

    const encoder = new TextEncoder();
    const reader = reactStream.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const helmetHtml = [
          helmetContext.helmet?.title?.toString() ?? "",
          helmetContext.helmet?.meta?.toString() ?? "",
          helmetContext.helmet?.link?.toString() ?? "",
          helmetContext.helmet?.style?.toString() ?? "",
          helmetContext.helmet?.script?.toString() ?? "",
        ].join("\n");

        controller.enqueue(
          encoder.encode(htmlStart.replace("<!--app-helmet-->", helmetHtml)),
        );

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }

        if (htmlEnd) {
          const dehydrated = dehydrate(queryClient, {
            shouldDehydrateQuery: (q) => !q.queryKey.includes(NO_DEHYDRATE),
          });

          const closingTag = "</body>";
          const idx = htmlEnd.lastIndexOf(closingTag);

          if (idx === -1) {
            controller.enqueue(encoder.encode(htmlEnd));
          } else {
            controller.enqueue(encoder.encode(htmlEnd.slice(0, idx)));
            const scripts = [`window.ZUDOKU_DATA=${safeSerialize(dehydrated)}`];
            if (ssrAuth) {
              scripts.push(
                `window.ZUDOKU_SSR_AUTH=${safeSerialize({ profile: ssrAuth.profile })}`,
              );
            }
            controller.enqueue(
              encoder.encode(`<script>${scripts.join(";")}</script>`),
            );
            controller.enqueue(encoder.encode(htmlEnd.slice(idx)));
          }
        }

        controller.close();
      },
    });

    const headers: HeadersInit = {
      "Content-Type": "text/html; charset=utf-8",
    };
    // Only suppress caching for pages that embed a per-user profile.
    // Anonymous renders (auth configured but no session) stay cacheable.
    if (ssrAuth?.profile) {
      headers["Cache-Control"] = "private, no-store";
    }

    return new Response(stream, {
      status: renderContext.status !== 200 ? renderContext.status : status,
      headers,
    });
  } catch (error) {
    logger.error(
      `SSR fatal render error (${request.method} ${request.url}):`,
      error,
    );
    const html = renderToStaticMarkup(<ServerError error={error} />);
    return new Response(html, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};

export const createServer = (options: {
  template: string;
  basePath?: string;
}) => {
  const routes = getRoutesByConfig(config);
  const app = new Hono();

  app.use(compress());
  app.route("/__z/auth/session", createSessionHandler(verifier));
  app.all("*", (c) =>
    handleRequest({
      template: options.template,
      request: c.req.raw,
      routes,
      basePath: options.basePath,
    }),
  );

  return app;
};
