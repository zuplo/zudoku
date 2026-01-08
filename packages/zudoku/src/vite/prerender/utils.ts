import type { RouteObject } from "react-router";

import { joinUrl } from "../../lib/util/joinUrl.js";

export const routesToPaths = (routes: RouteObject[]) => {
  const paths: string[] = [];
  const addPaths = (routes: RouteObject[], parentPath = "") => {
    for (const route of routes) {
      // skip catch-all routes and dynamic segments
      if (route.path?.includes("*") || route.path?.includes(":")) {
        continue;
      }

      // skip status pages
      if (route.path && /^\d+$/.test(route.path)) {
        continue;
      }

      const fullPath = route.path
        ? route.path.startsWith("/")
          ? route.path
          : joinUrl(parentPath, route.path)
        : parentPath;

      if (route.path) {
        paths.push(fullPath);
      }
      if (route.children) {
        addPaths(route.children, fullPath);
      }
    }
  };
  addPaths(routes);
  return paths;
};
