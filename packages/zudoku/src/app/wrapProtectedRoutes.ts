import type { RouteObject } from "react-router";
import type { ProtectedRoutesInput } from "../config/validators/ProtectedRoutesSchema.js";
import { normalizeProtectedRoutes } from "../lib/core/ZudokuContext.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import {
  matchesAnyProtectedPattern,
  matchesProtectedPattern,
} from "../lib/util/url.js";

type Visitor = (route: RouteObject, fullPath: string) => RouteObject;

// Route paths are relative to the router basename, like the pathname
// RouteGuard checks, so they're compared to the patterns as-is. Absolute child
// paths (e.g. OpenAPI's "/api/users" under "/api") already include the parent.
const visitRoutes = (
  rs: RouteObject[],
  visit: Visitor,
  parent = "",
): RouteObject[] =>
  rs.map((r) => {
    const fullPath = r.path
      ? r.path.startsWith("/")
        ? joinUrl(r.path)
        : joinUrl(parent, r.path)
      : parent;
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
): RouteObject[] => {
  const patterns = Object.keys(normalizeProtectedRoutes(protectedRoutes) ?? {});
  if (patterns.length === 0 || isAuthenticated) return routes;

  return visitRoutes(routes, (r, fullPath) => {
    if (typeof r.lazy !== "function") return r;
    return matchesAnyProtectedPattern(patterns, fullPath)
      ? { ...r, lazy: noop }
      : r;
  });
};

// Route-wrapping decision for an SSR/SSG render. The prerender does a second
// "bypass" pass over protected routes to build the search index; that pass must
// render the real (unstubbed) protected content, so it is treated as
// authenticated here. Without this, the bypass pass renders an empty shell and
// the Pagefind index for protected routes ends up empty (issue #2672).
export const wrapProtectedRoutesForRender = (
  routes: RouteObject[],
  protectedRoutes: ProtectedRoutesInput,
  {
    isAuthenticated,
    bypassProtection,
  }: {
    isAuthenticated: boolean;
    bypassProtection?: boolean;
  },
): RouteObject[] =>
  wrapProtectedRoutes(
    routes,
    protectedRoutes,
    isAuthenticated || bypassProtection === true,
  );

// Inline elements can't be chunk-isolated; RouteGuard still blocks render,
// but the JS ships in the main bundle. Only meaningful in dev.
export const warnInlineProtectedRoutes = (
  routes: RouteObject[],
  protectedRoutes: ProtectedRoutesInput,
) => {
  const patterns = Object.keys(normalizeProtectedRoutes(protectedRoutes) ?? {});
  if (patterns.length === 0) return;

  visitRoutes(routes, (r, fullPath) => {
    const isInline =
      (r.element != null || r.Component != null) &&
      typeof r.lazy !== "function";

    if (!r.path || !isInline) return r;

    const matched = patterns.find((p) => matchesProtectedPattern(p, fullPath));

    if (!matched) return r;

    // biome-ignore lint/suspicious/noConsole: dev-only advisory
    console.warn(
      `[zudoku] Route "${fullPath}" matches protected pattern "${matched}" but uses an inline element instead of lazy(). RouteGuard blocks rendering, but the JS ships in the main bundle. Use \`lazy: () => import(...)\` to gate at the chunk level.`,
    );

    return r;
  });
};
