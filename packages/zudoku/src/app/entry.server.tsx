import { dehydrate, QueryClient } from "@tanstack/react-query";
import { type HelmetData } from "@zudoku/react-helmet-async";
import type express from "express";
import logger from "loglevel";
import { Transform } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  isRouteErrorResponse,
  type RouteObject,
} from "react-router";
import "virtual:zudoku-theme.css";
import "vite/modulepreload-polyfill";
import { BootstrapStatic, ServerError } from "zudoku/components";
import { NO_DEHYDRATE } from "../lib/components/cache.js";
import type { PrerenderResponse } from "../vite/prerender/PrerenderResponse.js";
import "./main.css";
import { getRoutesByConfig } from "./main.js";
export { getRoutesByConfig };

export const render = async ({
  template,
  request: baseRequest,
  response,
  routes,
  basePath,
  bypassProtection,
}: {
  template: string;
  request: express.Request | Request;
  response: express.Response | PrerenderResponse;
  routes: RouteObject[];
  basePath?: string;
  bypassProtection?: boolean;
}) => {
  const { query, dataRoutes } = createStaticHandler(routes, {
    basename: basePath,
  });
  const queryClient = new QueryClient();

  const request =
    baseRequest instanceof Request
      ? baseRequest
      : createFetchRequest(baseRequest, response);

  const context = await query(request);
  let status = 200;

  if (context instanceof Response) {
    if ([301, 302, 303, 307, 308].includes(context.status)) {
      return response.redirect(
        import.meta.env.PROD ? context.status : 307,
        context.headers.get("Location")!,
      );
    }

    throw context;
  } else if (context.errors) {
    // when throwing a Response from a loader it will be caught here
    // unfortunately it is not `instanceof Response` for some reason
    const firstError = Object.values(context.errors).find(isRouteErrorResponse);

    if (firstError?.status) {
      status = firstError.status;
    }
  }

  const router = createStaticRouter(dataRoutes, context);
  const helmetContext = {} as HelmetData["context"];

  const App = (
    <BootstrapStatic
      router={router}
      context={context}
      queryClient={queryClient}
      helmetContext={helmetContext}
      bypassProtection={bypassProtection}
    />
  );

  const { pipe } = renderToPipeableStream(App, {
    onShellError(error) {
      response.status(500);
      response.set({ "Content-Type": "text/html" });

      const html = renderToStaticMarkup(<ServerError error={error} />);

      response.send(html);
    },
    onAllReady() {
      response.set({ "Content-Type": "text/html" });
      response.status(status);

      const transformStream = new Transform({
        transform(chunk, encoding, callback) {
          response.write(chunk, encoding);
          callback();
        },
      });

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      if (!htmlStart) {
        throw new Error("No <!--app-html--> found in template");
      }

      response.write(
        htmlStart.replace(
          "<!--app-helmet-->",
          [
            helmetContext.helmet.title.toString(),
            helmetContext.helmet.meta.toString(),
            helmetContext.helmet.link.toString(),
            helmetContext.helmet.style.toString(),
            helmetContext.helmet.script.toString(),
          ].join("\n"),
        ),
      );

      transformStream.on("finish", () => {
        const dehydrated = dehydrate(queryClient, {
          shouldDehydrateQuery: (query) =>
            !query.queryKey.includes(NO_DEHYDRATE),
        });

        response.end(
          htmlEnd?.replace(
            "</body>",
            `<script>window.DATA=${JSON.stringify(dehydrated)}</script></body>`,
          ),
        );
      });

      pipe(transformStream);
    },
    onError(error) {
      status = 500;
      if (import.meta.env.PROD) {
        throw error;
      }
      logger.error(error);
    },
  });
};

export function createFetchRequest(
  req: express.Request,
  res: express.Response | PrerenderResponse,
): Request {
  const origin = `${req.protocol}://${req.get("host")}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();
  res.on("close", () => controller.abort());

  const headers = new Headers();

  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
}
