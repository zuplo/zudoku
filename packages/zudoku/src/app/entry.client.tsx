import type { DehydratedState } from "@tanstack/react-query";
import { createRoot, hydrateRoot } from "react-dom/client";
import {
  createBrowserRouter,
  matchRoutes,
  type RouteObject,
} from "react-router";
import "vite/modulepreload-polyfill";
import config from "virtual:zudoku-config";
import type { UserProfile } from "../lib/authentication/state.js";
import { BootstrapClient } from "../lib/components/Bootstrap.js";
import { getRoutesByConfig, shikiReady } from "./main.js";

const routes = getRoutesByConfig(config);
// biome-ignore lint/style/noNonNullAssertion: We know the root element exists
const root = document.getElementById("root")!;

// Injected by entry.server.tsx into a <script> tag before </body>.
// ZUDOKU_DATA: dehydrated React Query cache for SSR.
// ZUDOKU_SSR_AUTH: auth profile from httpOnly cookies (no tokens, client-safe).
// Used by the zustand auth store (state.ts) to seed initial state so the
// client renders the same auth UI the server did, avoiding hydration mismatch.
declare global {
  interface Window {
    ZUDOKU_VERSION: string;
    ZUDOKU_DATA?: DehydratedState;
    ZUDOKU_SSR_AUTH?: { profile: UserProfile };
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
  createRoot(root).render(<BootstrapClient router={router} />);
}

async function hydrate(routes: RouteObject[]) {
  await Promise.all([hydrateLazyRoutes(routes), shikiReady]);

  const router = createBrowserRouter(routes, {
    basename: config.basePath,
  });

  hydrateRoot(root, <BootstrapClient hydrate router={router} />);
}

// This is a workaround to avoid version skewing
// See https://vite.dev/guide/build.html#load-error-handling
// TODO: Implement a more advanced solution if there are CDN urls or e.g. Vercel Skew Protection
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  window.location.reload();
});
