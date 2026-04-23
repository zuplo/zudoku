import type { RouteObject } from "react-router";
import { joinUrl } from "../../lib/util/joinUrl.js";

const resolveRoutePath = (path: string): string | undefined => {
  const segments = path.split("/");
  if (segments.some((s) => s.startsWith(":") && !s.endsWith("?"))) {
    return undefined;
  }
  return segments.filter((s) => !s.startsWith(":")).join("/") || undefined;
};

const isSkipped = (path: string) => path.includes("*") || /^\d+$/.test(path);

export type RouteRewrite = { source: string; destination: string };

type ResolvedRoute = {
  path: string;
  hasStrippedParams: boolean;
  children: ResolvedRoute[];
};

const resolveRoutes = (
  routes: RouteObject[],
  parentPath = "",
): ResolvedRoute[] =>
  routes.flatMap((route) => {
    if (route.path && isSkipped(route.path)) return [];

    const routePath = route.path ? resolveRoutePath(route.path) : undefined;
    if (route.path && !routePath) return [];

    const fullPath = routePath
      ? routePath.startsWith("/")
        ? routePath
        : joinUrl(parentPath, routePath)
      : parentPath;

    const hasStrippedParams =
      route.path?.split("/").some((s) => s.startsWith(":")) ?? false;

    return [
      {
        path: fullPath,
        hasStrippedParams,
        children: resolveRoutes(route.children ?? [], fullPath),
      },
    ];
  });

const collectPaths = (
  resolved: ResolvedRoute[],
  parentPath: string,
): string[] =>
  resolved.flatMap((r) => [
    ...(r.path !== parentPath ? [r.path] : []),
    ...collectPaths(r.children, r.path),
  ]);

const collectRewrites = (resolved: ResolvedRoute[]): RouteRewrite[] =>
  resolved.flatMap((r) => [
    ...(r.hasStrippedParams && r.path
      ? [
          {
            source: `${r.path}/(.+)`,
            destination: r.path === "/" ? "/index.html" : `${r.path}.html`,
          },
        ]
      : []),
    ...collectRewrites(r.children),
  ]);

export const routesToPaths = (routes: RouteObject[]): string[] =>
  collectPaths(resolveRoutes(routes), "");

export const routesToRewrites = (routes: RouteObject[]): RouteRewrite[] =>
  collectRewrites(resolveRoutes(routes));
