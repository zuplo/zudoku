import type { RouteObject } from "react-router";

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

      if (route.path) {
        const fullPath = route.path.startsWith("/")
          ? route.path
          : parentPath + "/" + route.path;
        paths.push(fullPath.startsWith("/") ? fullPath : `/${fullPath}`);
        if (route.children) {
          addPaths(route.children, fullPath);
        }
      } else if (route.children) {
        addPaths(route.children, parentPath);
      }
    }
  };
  addPaths(routes);
  return paths;
};
