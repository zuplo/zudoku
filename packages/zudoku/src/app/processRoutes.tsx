import type { RouteObject } from "react-router";
import { Layout } from "../lib/components/Layout.js";

const LazyRouteFallback = (
  <div className="col-span-full row-span-full grid place-items-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
  </div>
);

/**
 * Recursively adds a hydrateFallbackElement to routes with lazy loading
 * so the content area shows a spinner instead of rendering empty while
 * the route module loads.
 */
const addHydrateFallbacks = (routes: RouteObject[]): RouteObject[] =>
  routes.map((route) => {
    const updated = { ...route } as RouteObject;
    if (route.lazy && !route.hydrateFallbackElement) {
      updated.hydrateFallbackElement = LazyRouteFallback;
    }
    if (route.children) {
      updated.children = addHydrateFallbacks(route.children);
    }
    return updated;
  });

export const processRoutes = (
  routes: RouteObject[],
  layoutDisabled?: boolean,
): RouteObject[] =>
  addHydrateFallbacks(
    routes.map((r) => {
      const shouldWrapWithLayout = layoutDisabled
        ? r.handle?.layout === "default"
        : r.handle?.layout !== "none";

      const route = r.children
        ? {
            ...r,
            children: shouldWrapWithLayout
              ? r.children
              : processRoutes(r.children, true),
          }
        : r;

      return shouldWrapWithLayout
        ? { element: <Layout />, children: [route] }
        : route;
    }),
  );
