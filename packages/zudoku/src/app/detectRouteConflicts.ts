import type { RouteObject } from "react-router";
import { joinUrl } from "../lib/util/joinUrl.js";

// Collect the absolute path of every route that declares one. Child paths in
// zudoku plugins are authored as absolute (already basePath-joined), so only
// join with the parent when the child path is relative.
const collectPaths = (
  routes: RouteObject[],
  parent = "",
  acc = new Set<string>(),
): Set<string> => {
  for (const route of routes) {
    const fullPath =
      route.path != null
        ? route.path.startsWith("/")
          ? joinUrl(route.path)
          : joinUrl(parent, route.path)
        : parent;

    if (route.path != null) acc.add(fullPath);
    if (route.children) collectPaths(route.children, fullPath, acc);
  }

  return acc;
};

/**
 * Detect routes registered by more than one plugin. Each entry in
 * `pluginRoutes` is the route tree returned by a single plugin's `getRoutes()`.
 * Paths are deduplicated within a plugin (a plugin legitimately repeats a path
 * across a parent and its index child), so only paths owned by multiple plugins
 * are reported. Returns the conflicting paths sorted alphabetically.
 */
export const detectRouteConflicts = (
  pluginRoutes: RouteObject[][],
): string[] => {
  const counts = new Map<string, number>();

  for (const routes of pluginRoutes) {
    for (const path of collectPaths(routes)) {
      counts.set(path, (counts.get(path) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([path]) => path)
    .sort();
};
