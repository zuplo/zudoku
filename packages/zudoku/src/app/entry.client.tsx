import { createRoot, hydrateRoot } from "react-dom/client";
import {
  createBrowserRouter,
  matchRoutes,
  type RouteObject,
} from "react-router-dom";
import config from "virtual:zudoku-config";
import "virtual:zudoku-theme.css";
import "vite/modulepreload-polyfill";
import { Bootstrap } from "zudoku/components";
import "./main.css";
import { getRoutesByConfig } from "./main.js";

const routes = getRoutesByConfig(config);
const root = document.getElementById("root")!;

if (config.sentry?.enabled) {
  void import("./sentry.js").then((mod) => {
    mod.initSentry(config.sentry!);
  });
}

if (root.childElementCount > 0) {
  void hydrate(routes);
} else {
  void render(routes);
}

async function hydrateLazyRoutes(routes: RouteObject[]) {
  const path = window.location.pathname;
  const lazyMatches = matchRoutes(routes, path, config.basePath)?.filter(
    (m) => m.route.lazy,
  );

  if (lazyMatches?.length) {
    await Promise.all(
      lazyMatches.map(async (m) => {
        const routeModule = await m.route.lazy!();
        Object.assign(m.route, { ...routeModule, lazy: undefined });
      }),
    );
  }
}

function render(routes: RouteObject[]) {
  const router = createBrowserRouter(routes, {
    basename: config.basePath,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
      v7_normalizeFormMethod: true,
    },
  });
  createRoot(root).render(<Bootstrap router={router} />);
}

async function hydrate(routes: RouteObject[]) {
  await hydrateLazyRoutes(routes);
  const router = createBrowserRouter(routes, {
    basename: config.basePath,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
      v7_normalizeFormMethod: true,
    },
  });

  hydrateRoot(root, <Bootstrap hydrate router={router} />);
}

// This is a workaround to avoid version skewing
// See https://vite.dev/guide/build.html#load-error-handling
// TODO: Implement a more advanced solution if there are CDN urls or e.g. Vercel Skew Protection
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  window.location.reload();
});
