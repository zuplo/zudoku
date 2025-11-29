import type { RouteObject } from "react-router";

export const routesToPaths = (routes: RouteObject[]) => {
  const paths: string[] = [];
  const addPaths = (routes: RouteObject[]) => {
    for (const route of routes) {
      // skip catch-all routes and dynamic segments
      if (route.path?.includes("*") || route.path?.includes(":")) {
        continue;
      }

      // skip status pages
      if (route.path && /\d+/.test(route.path)) {
        continue;
      }

      if (route.path) {
        paths.push(route.path.startsWith("/") ? route.path : `/${route.path}`);
      }
      if (route.children) {
        addPaths(route.children);
      }
    }
  };
  addPaths(routes);
  return paths;
};
