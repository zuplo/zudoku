import type { RouteObject } from "react-router";
import type { ProtectedRoutesInput } from "../config/validators/ProtectedRoutesSchema.js";
import { normalizeProtectedRoutes } from "../lib/core/ZudokuContext.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import {
  matchesAnyProtectedPattern,
  matchesProtectedPattern,
} from "../lib/util/url.js";

type Visitor = (route: RouteObject, fullPath: string) => RouteObject;

const visitRoutes = (
  rs: RouteObject[],
  visit: Visitor,
  parent = "",
): RouteObject[] =>
  rs.map((r) => {
    const fullPath = r.path ? joinUrl(parent, r.path) : parent;
    const next = visit(r, fullPath);

    return next.children
      ? { ...next, children: visitRoutes(next.children, visit, fullPath) }
      : next;
  });

const noop: RouteObject["lazy"] = async () => ({ element: null });

// Stub lazy() on routes matching a protected pattern when unauthed so the
// gated chunk doesn't fetch. Public routes stay intact. RouteGuard renders
// the sign-in UI.
export const wrapProtectedRoutes = (
  routes: RouteObject[],
  protectedRoutes: ProtectedRoutesInput,
  isAuthenticated: boolean,
  basePath?: string,
): RouteObject[] => {
  const patterns = Object.keys(normalizeProtectedRoutes(protectedRoutes) ?? {});
  if (patterns.length === 0 || isAuthenticated) return routes;

  const fullPatterns = patterns.map((p) => joinUrl(basePath, p));

  return visitRoutes(routes, (r, fullPath) => {
    if (typeof r.lazy !== "function") return r;
    return matchesAnyProtectedPattern(fullPatterns, fullPath)
      ? { ...r, lazy: noop }
      : r;
  });
};

// Inline elements can't be chunk-isolated; RouteGuard still blocks render,
// but the JS ships in the main bundle. Only meaningful in dev.
export const warnInlineProtectedRoutes = (
  routes: RouteObject[],
  protectedRoutes: ProtectedRoutesInput,
  basePath?: string,
) => {
  const patterns = Object.keys(normalizeProtectedRoutes(protectedRoutes) ?? {});
  if (patterns.length === 0) return;

  const fullPatterns = patterns.map((p) => joinUrl(basePath, p));

  visitRoutes(routes, (r, fullPath) => {
    const isInline =
      (r.element != null || r.Component != null) &&
      typeof r.lazy !== "function";

    if (!r.path || !isInline) return r;

    const matched = fullPatterns.find((p) =>
      matchesProtectedPattern(p, fullPath),
    );

    if (!matched) return r;

    // biome-ignore lint/suspicious/noConsole: dev-only advisory
    console.warn(
      `[zudoku] Route "${fullPath}" matches protected pattern "${matched}" but uses an inline element instead of lazy(). RouteGuard blocks rendering, but the JS ships in the main bundle. Use \`lazy: () => import(...)\` to gate at the chunk level.`,
    );

    return r;
  });
};
