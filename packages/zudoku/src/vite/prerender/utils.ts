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

export const routesToPaths = (
  routes: RouteObject[],
  parentPath = "",
): string[] =>
  routes.flatMap((route) => {
    if (route.path && isSkipped(route.path)) return [];

    const routePath = route.path ? resolveRoutePath(route.path) : undefined;
    if (route.path && !routePath) return [];

    const fullPath = routePath
      ? routePath.startsWith("/")
        ? routePath
        : joinUrl(parentPath, routePath)
      : parentPath;

    return [
      ...(routePath && fullPath !== parentPath ? [fullPath] : []),
      ...routesToPaths(route.children ?? [], fullPath),
    ];
  });
