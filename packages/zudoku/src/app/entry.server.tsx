import { dehydrate, QueryClient } from "@tanstack/react-query";
import type { HelmetData } from "@zudoku/react-helmet-async";
import logger from "loglevel";
import { renderToReadableStream, renderToStaticMarkup } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  isRouteErrorResponse,
  type RouteObject,
} from "react-router";
import "vite/modulepreload-polyfill";
import { BootstrapStatic } from "../lib/components/Bootstrap.js";
import { NO_DEHYDRATE } from "../lib/components/cache.js";
import { ServerError } from "../lib/errors/ServerError.js";
import { highlighterPromise } from "../lib/shiki.js";
import { getRoutesByConfig } from "./main.js";
export { getRoutesByConfig };

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

  const router = createStaticRouter(dataRoutes, context);
  const helmetContext = {} as HelmetData["context"];
  const renderContext = {
    status: 200,
    bypassProtection: bypassProtection ?? false,
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
          const serialized = JSON.stringify(dehydrated)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e");

          const closingTag = "</body>";
          const idx = htmlEnd.lastIndexOf(closingTag);

          if (idx === -1) {
            controller.enqueue(encoder.encode(htmlEnd));
          } else {
            controller.enqueue(encoder.encode(htmlEnd.slice(0, idx)));
            controller.enqueue(
              encoder.encode(`<script>window.DATA=${serialized}</script>`),
            );
            controller.enqueue(encoder.encode(htmlEnd.slice(idx)));
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      status: renderContext.status !== 200 ? renderContext.status : status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    const html = renderToStaticMarkup(<ServerError error={error} />);
    return new Response(html, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};
