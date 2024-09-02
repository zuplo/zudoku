import { type HelmetData } from "@zudoku/react-helmet-async";
import type express from "express";
import logger from "loglevel";
import { Transform } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { isRouteErrorResponse } from "react-router-dom";
import {
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server.js";
import "virtual:zudoku-theme.css";
import { BootstrapStatic, ServerError } from "zudoku/components";
import type { ZudokuConfig } from "../config/config.js";
import type { FileWritingResponse } from "../vite/prerender.js";
import "./main.css";
import { getRoutesByConfig } from "./main.js";

export { getRoutesByConfig };

export const render = async ({
  template,
  request: baseRequest,
  response,
  config,
}: {
  template: string;
  request: express.Request | Request;
  response: express.Response | FileWritingResponse;
  config: ZudokuConfig;
}) => {
  const routes = getRoutesByConfig(config);
  const { query, dataRoutes } = createStaticHandler(routes, {
    basename: config.basePath,
  });

  const request =
    baseRequest instanceof Request
      ? baseRequest
      : createFetchRequest(baseRequest, response);

  if (!request) {
    throw new Error("Either fetchRequest or expressRequest must be provided");
  }
  const context = await query(request);
  let status = 200;

  if (context instanceof Response) {
    if ([301, 302, 303, 307, 308].includes(context.status)) {
      return response.redirect(
        context.status,
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

  const { pipe } = renderToPipeableStream(
    <BootstrapStatic
      router={router}
      context={context}
      helmetContext={helmetContext}
    />,
    {
      onShellError(error) {
        response.status(500);
        response.set({ "Content-Type": "text/html" });

        const html = renderToStaticMarkup(<ServerError error={error} />);

        response.send(html);
      },
      // for SSG we could use onAllReady instead of onShellReady
      // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
      onShellReady() {
        response.set({ "Content-Type": "text/html" });
        response.status(status);

        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            response.write(chunk, encoding);
            callback();
          },
        });

        const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

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
          response.end(htmlEnd);
        });

        pipe(transformStream);
      },
      onError(error) {
        status = 500;
        logger.error(error);
      },
    },
  );
};

export function createFetchRequest(
  req: express.Request,
  res: express.Response | FileWritingResponse,
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
