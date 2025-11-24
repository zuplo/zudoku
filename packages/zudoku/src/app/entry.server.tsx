import { Transform } from "node:stream";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import type { HelmetData } from "@zudoku/react-helmet-async";
import type express from "express";
import logger from "loglevel";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  isRouteErrorResponse,
  type RouteObject,
} from "react-router";
import "vite/modulepreload-polyfill";
import { BootstrapStatic, ServerError } from "zudoku/__internal";
import { NO_DEHYDRATE } from "../lib/components/cache.js";
import type { SpecRouteHandler } from "../lib/plugins/openapi/util/specRoute.js";
import type { PrerenderResponse } from "../vite/prerender/PrerenderResponse.js";
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

  // Specification requests bypass the React render pipeline completely so they
  // can be streamed directly and avoid unnecessary work.
  if (await maybeHandleSpecRoute(request, response, routes)) {
    return;
  }

  const context = await query(request);
  let status = 200;

  if (context instanceof Response) {
    if ([301, 302, 303, 307, 308].includes(context.status)) {
      return response.redirect(
        import.meta.env.PROD ? context.status : 307,
        context.headers.get("Location") ?? "",
      );
    }

    await sendFetchResponse(response, context);
    return;
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

        if (!htmlEnd) return response.end();

        const closingTag = "</body>";
        const idx = htmlEnd.lastIndexOf(closingTag);

        if (idx === -1) return response.end(htmlEnd);

        const serialized = JSON.stringify(dehydrated)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e");

        response.write(htmlEnd.slice(0, idx));
        response.write("<script>window.DATA=");
        response.write(serialized);
        response.write("</script>");
        response.end(htmlEnd.slice(idx));
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

// Normalizes incoming URLs so both `/foo` and `/foo/` resolve to the same spec
// route entry when we compare paths later.
const normalizePathname = (value: string) => {
  if (value.length <= 1) {
    return value;
  }
  return value.replace(/\/+$/, "");
};

type SpecRouteMatcher = (specRoute: SpecRouteHandler) => boolean;

// Walks every route (including children) until we find one matching the
// provided predicate. The matcher lets us re-use the search for both canonical
// `~spec` paths and aliases.
const findSpecRoute = (
  routes: RouteObject[],
  matcher: SpecRouteMatcher,
): SpecRouteHandler | undefined => {
  for (const route of routes) {
    const handle = route.handle;
    const specRoute = handle?.specRoute;
    if (specRoute && matcher(specRoute)) {
      return specRoute;
    }
    if (route.children) {
      const child = findSpecRoute(route.children, matcher);
      if (child) {
        return child;
      }
    }
  }
};

const findSpecRouteHandler = (
  routes: RouteObject[],
  pathname: string,
): SpecRouteHandler | undefined =>
  findSpecRoute(
    routes,
    (specRoute) => normalizePathname(specRoute.path) === pathname,
  );

// Supports requests hitting `/spec` by mapping them back to the `~spec`
// canonical route registered for the same base path. This means we can expose a
// clean button URL while still reserving `/spec` for aliases.
const matchesSpecAlias = (specPath: string, pathname: string) => {
  if (!pathname.endsWith("/spec")) {
    return false;
  }
  const normalizedSpecPath = normalizePathname(specPath);
  if (!normalizedSpecPath.endsWith("~spec")) {
    return false;
  }
  const base = normalizedSpecPath.replace(/\/~spec$/, "");
  if (!base || base === "/") {
    return false;
  }
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return pathname.startsWith(prefix);
};

const findSpecRouteAlias = (
  routes: RouteObject[],
  pathname: string,
): SpecRouteHandler | undefined =>
  findSpecRoute(routes, (specRoute) =>
    matchesSpecAlias(specRoute.path, pathname),
  );

const isExpressResponse = (
  res: express.Response | PrerenderResponse,
): res is express.Response => {
  return "setHeader" in res;
};

// Applies the outgoing spec response to either an express response or the
// prerender shim. Everything funnels through here so headers/status handling is
// consistent.
const sendSpecResponse = async (
  target: express.Response | PrerenderResponse,
  specResponse: Response,
) => {
  const headers = Object.fromEntries(specResponse.headers.entries());
  if (isExpressResponse(target)) {
    target.set(headers);
  } else {
    target.set();
  }

  target.status(specResponse.status);

  if (!specResponse.body) {
    const result = target.end();
    if (result instanceof Promise) {
      await result;
    }
    return;
  }

  const body = await specResponse.text();
  const sendResult = target.send(body);
  if (sendResult instanceof Promise) {
    await sendResult;
  }
};

const maybeHandleSpecRoute = async (
  request: Request,
  response: express.Response | PrerenderResponse,
  routes: RouteObject[],
) => {
  // Try exact matches first (`~spec`), then handle the `/spec` alias the UI
  // links to. Either path short-circuits the main render pipeline.
  const pathname = normalizePathname(new URL(request.url).pathname);
  let specRoute = findSpecRouteHandler(routes, pathname);
  if (!specRoute && pathname.endsWith("/spec")) {
    specRoute = findSpecRouteAlias(routes, pathname);
  }
  if (!specRoute) {
    return false;
  }

  const specResponse = await specRoute.createResponse();
  await sendSpecResponse(response, specResponse);
  return true;
};

// Writes a standard Fetch API `Response` to either an express response or the
// prerender shim. React Router loaders/actions can return these directly, so we
// centralize the conversion logic to keep `render` tidy.
const sendFetchResponse = async (
  target: express.Response | PrerenderResponse,
  response: Response,
) => {
  const headers = Object.fromEntries(response.headers.entries());
  target.status(response.status);
  if (Object.keys(headers).length > 0) {
    target.set(headers);
  }

  if (!response.body) {
    const result = target.end();
    if (result instanceof Promise) {
      await result;
    }
    return;
  }

  const body = await response.text();
  const sendResult = target.send(body);
  if (sendResult instanceof Promise) {
    await sendResult;
  }
};
