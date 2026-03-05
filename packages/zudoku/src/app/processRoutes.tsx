import type { RouteObject } from "react-router";
import { Layout } from "../lib/components/Layout.js";

export const processRoutes = (
  routes: RouteObject[],
  layoutDisabled?: boolean,
): RouteObject[] =>
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
  });
