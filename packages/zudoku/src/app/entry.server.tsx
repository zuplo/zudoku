import { dehydrate, QueryClient } from "@tanstack/react-query";
import type { HelmetData } from "@zudoku/react-helmet-async";
import { Hono } from "hono";
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
import { BootstrapStatic } from "../lib/components/Bootstrap.js";
import { NO_DEHYDRATE } from "../lib/components/cache.js";
import type { SSRAuthState } from "../lib/components/context/RenderContext.js";
import { ServerError } from "../lib/errors/ServerError.js";
import { highlighterPromise } from "../lib/shiki.js";
import { getRoutesByConfig } from "./main.js";
export { getRoutesByConfig };

const safeSerialize = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

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
  const { query, dataRoutes } = createStaticHandler(routes, {
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

  const { accessToken, profile } = parseCookies(request);
  // Emit auth state when configured, even if profile is null, so the client
  // knows whether the server checked auth.
  const ssrAuth: SSRAuthState | undefined = configuredAuthProvider
    ? { accessToken, profile: profile ?? null }
    : undefined;

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
        if (import.meta.env.PROD) {
          logger.error("SSR Error:", error);
        }
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

  app.route("/__z/auth/session", createSessionHandler(configuredAuthProvider));
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
