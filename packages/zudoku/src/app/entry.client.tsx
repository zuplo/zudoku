import { createRoot, hydrateRoot } from "react-dom/client";
import {
  createBrowserRouter,
  matchRoutes,
  type RouteObject,
} from "react-router-dom";
import config from "virtual:zudoku-config";
import "virtual:zudoku-theme.css";
import { Bootstrap } from "zudoku/components";
import "./main.css";
import { getRoutesByConfig } from "./main.js";

const routes = getRoutesByConfig(config);
const root = document.getElementById("root")!;

if (root.childElementCount > 0) {
  void hydrate(routes);
} else {
  void render(routes);
}

async function hydrateLazyRoutes(routes: RouteObject[]) {
  const path = window.location.pathname.slice(config.basePath?.length ?? 0);
  const lazyMatches = matchRoutes(routes, path)?.filter((m) => m.route.lazy);

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
  });
  createRoot(root).render(<Bootstrap router={router} />);
}

async function hydrate(routes: RouteObject[]) {
  await hydrateLazyRoutes(routes);
  const router = createBrowserRouter(routes, {
    basename: config.basePath,
  });

  hydrateRoot(root, <Bootstrap hydrate router={router} />);
}
