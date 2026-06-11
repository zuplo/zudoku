import { dehydrate, QueryClient } from "@tanstack/react-query";
import { createHead, transformHtmlTemplate } from "@unhead/react/server";
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
import { buildManifest } from "../lib/manifest.js";
import { highlighterPromise } from "../lib/shiki.js";
import type { Adapter } from "./adapter.js";
import { getRoutesByConfig } from "./main.js";
import { protectChunks as rawProtectChunks } from "./protectChunks.js";
import { getSsrCacheControl } from "./ssrCacheControl.js";
import { wrapProtectedRoutes } from "./wrapProtectedRoutes.js";

export { getRoutesByConfig };
// The fully transformed config (plugins' `transformConfig` applied), so
// consumers like the prerenderer don't re-run the transform themselves.
export { config };
export type { Adapter, AdapterContext } from "./adapter.js";

// Shared cached verifier for session handler, SSR render, and protected-chunk gate.
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

// Profile must come from the verifier so a forged cookie can't render
// protected HTML. SSG has no runtime cookie and short-circuits.
const resolveSsrAuth = async (
  request: Request,
): Promise<SSRAuthState | undefined> => {
  if (!import.meta.env.ZUDOKU_HAS_SERVER || !configuredAuthProvider) return;

  const { accessToken } = parseCookies(request);
  if (!accessToken || !verifier)
    return { accessToken: undefined, profile: null };

  try {
    const verified = await verifier(accessToken);
    return verified
      ? { accessToken, profile: verified.profile }
      : { accessToken: undefined, profile: null };
  } catch (error) {
    logger.error(
      `SSR auth verifier error (${request.method} ${request.url}):`,
      error,
    );
    return { accessToken: undefined, profile: null };
  }
};

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
  const ssrAuth = await resolveSsrAuth(request);

  // No-op lazy() on protected subtrees for unauthed requests so loaders
  // don't run for a 401 render.
  const effectiveRoutes = wrapProtectedRoutes(
    routes,
    config.protectedRoutes,
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
  const head = createHead();
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
      head={head}
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

    const headHtml = await transformHtmlTemplate(head, htmlStart);

    const encoder = new TextEncoder();
    const reader = reactStream.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(headHtml));

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
    const finalStatus =
      renderContext.status !== 200 ? renderContext.status : status;
    const cacheControl = getSsrCacheControl(finalStatus, !!ssrAuth?.profile);
    if (cacheControl) {
      headers["Cache-Control"] = cacheControl;
    }

    return new Response(stream, {
      status: finalStatus,
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

export const manifest = buildManifest({
  basePath: config.basePath,
  protectedRoutes: config.protectedRoutes,
});

export const createApp = () => new Hono();

export type MountOptions<T = Hono> = {
  adapter?: Adapter<T>;
  template?: string;
};

declare const __ZUDOKU_TEMPLATE__: string;

export const mount = <T = Hono>(
  app: Hono,
  options: MountOptions<T> = {},
): T => {
  const template = options.template ?? __ZUDOKU_TEMPLATE__;
  const basePath = config.basePath;
  const routes = getRoutesByConfig(config);

  app.use(compress());
  app.route(manifest.auth.sessionEndpoint, createSessionHandler(verifier));
  options.adapter?.setup?.(app, { basePath, manifest, protectChunks });
  app.all("*", (c) =>
    handleRequest({ template, request: c.req.raw, routes, basePath }),
  );

  return (options.adapter?.finalize?.(app) ?? app) as T;
};

export const createServer = <T = Hono>(options: MountOptions<T> = {}): T =>
  mount(createApp(), options);
