import type { DehydratedState } from "@tanstack/react-query";
import { createHead } from "@unhead/react/client";
import { createRoot, hydrateRoot } from "react-dom/client";
import {
  createBrowserRouter,
  matchRoutes,
  type RouteObject,
} from "react-router";
import "vite/modulepreload-polyfill";
import config from "virtual:zudoku-config";
import { setupCookieSync } from "../lib/authentication/cookie-sync.js";
import { authState } from "../lib/authentication/state.js";
import { BootstrapClient } from "../lib/components/Bootstrap.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { getRoutesByConfig, shikiReady } from "./main.js";

if (import.meta.env.ZUDOKU_HAS_SERVER) {
  setupCookieSync(authState, joinUrl(config.basePath, "/__z/auth/session"));
}

const routes = getRoutesByConfig(config);
// biome-ignore lint/style/noNonNullAssertion: We know the root element exists
const root = document.getElementById("root")!;
const head = createHead();

declare global {
  interface Window {
    ZUDOKU_VERSION: string;
    ZUDOKU_DATA?: DehydratedState;
  }
}

window.ZUDOKU_VERSION = process.env.ZUDOKU_VERSION ?? "unknown";

if (process.env.SENTRY_DSN) {
  void import("./sentry.js").then((mod) => {
    mod.initSentry({ dsn: process.env.SENTRY_DSN as string });
  });
}

if (root.childElementCount > 0) {
  void hydrate(routes);
} else {
  void render(routes);
}

if (import.meta.env.IS_ZUPLO) {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.log(
    `%cPowered by Zuplo v${window.ZUDOKU_VERSION}`,
    [
      "color: #Df0097",
      "line-height: 50px",
      "font-weight: bolder",
      "font-size: 15px",
      "text-align: center",
      "letter-spacing: 5px",
    ].join(" ;"),
  );
} else {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.log(
    `%cZUDOKU%c by Zuplo v${window.ZUDOKU_VERSION}`,
    [
      "color: #FF00BD",
      "line-height: 50px",
      "font-weight: bolder",
      "font-size: 30px",
      "-webkit-text-stroke-width: 1px",
      "-webkit-text-stroke-color: #FF00BD",
      "text-transform: uppercase",
      "text-align: center",
      "letter-spacing: 5px",
    ].join(" ;"),
    [
      "color: #Df0097",
      "line-height: 50px",
      "font-weight: bolder",
      "font-size: 15px",
      "text-align: center",
      "letter-spacing: 5px",
    ].join(" ;"),
  );
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.log("» Learn more about Zudoku https://zudoku.dev");
}

async function hydrateLazyRoutes(routes: RouteObject[]) {
  const path = window.location.pathname;
  const lazyMatches = matchRoutes(routes, path, config.basePath)?.filter(
    (m) => m.route.lazy,
  );

  if (lazyMatches?.length) {
    await Promise.all(
      lazyMatches.map(async (m) => {
        if (typeof m.route.lazy !== "function") return;

        const routeModule = await m.route.lazy();
        Object.assign(m.route, { ...routeModule, lazy: undefined });
      }),
    );
  }
}

function render(routes: RouteObject[]) {
  const router = createBrowserRouter(routes, {
    basename: config.basePath,
  });
  createRoot(root).render(<BootstrapClient router={router} head={head} />);
}

async function hydrate(routes: RouteObject[]) {
  await Promise.all([hydrateLazyRoutes(routes), shikiReady]);

  const router = createBrowserRouter(routes, {
    basename: config.basePath,
  });

  hydrateRoot(root, <BootstrapClient hydrate router={router} head={head} />);
}

// Reload on chunk preload failures to recover from version skew.
// Throttled so a non-recoverable error (e.g. auth-gated chunk 401) doesn't loop infinitely.
// https://vite.dev/guide/build.html#load-error-handling
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  const last = Number(sessionStorage.getItem("zudoku:preload-reload-ts") ?? 0);
  if (Date.now() - last < 30_000) return;
  sessionStorage.setItem("zudoku:preload-reload-ts", String(Date.now()));
  window.location.reload();
});
