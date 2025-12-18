import type { RouteObject } from "react-router";

const joinPaths = (parentPath: string, childPath: string): string => {
  // Normalize by removing trailing slashes from parent and leading slashes from child
  const normalizedParent = parentPath.replace(/\/+$/, "");
  const normalizedChild = childPath.replace(/^\/+/, "");

  // If parent is empty, just return the child with leading slash
  if (!normalizedParent) {
    return `/${normalizedChild}`;
  }

  // If child is empty, return parent as-is
  if (!normalizedChild) {
    return normalizedParent;
  }

  // Join with single slash and ensure leading slash
  const joined = `${normalizedParent}/${normalizedChild}`;
  return joined.startsWith("/") ? joined : `/${joined}`;
};

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
          : joinPaths(parentPath, route.path);
        // Normalize the path before pushing to avoid multiple consecutive slashes
        const normalizedPath = fullPath.replace(/\/+/g, "/");
        paths.push(
          normalizedPath.startsWith("/")
            ? normalizedPath
            : `/${normalizedPath}`,
        );
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
