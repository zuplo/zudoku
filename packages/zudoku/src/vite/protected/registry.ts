import { matchPath } from "react-router";
import type { ConfigWithMeta } from "../../config/loader.js";
import { ProtectedRoutesSchema } from "../../config/validators/ProtectedRoutesSchema.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { matchesProtectedPattern } from "../../lib/util/url.js";

// Module routes contributed by auto-detection or registerProtectedScope.
export type ModuleScope =
  | { type: "route"; path: string }
  | { type: "subtree"; root: string };

const scopes = new Map<string, ModuleScope[]>();

export const clearProtectedRegistry = () => scopes.clear();

export const registerProtectedScope = (
  moduleId: string,
  scope: ModuleScope,
) => {
  const list = scopes.get(moduleId);
  if (list) list.push(scope);
  else scopes.set(moduleId, [scope]);
};

export const getProtectedScopes = (moduleId: string) => scopes.get(moduleId);

export const protectedRegistryEntries = (): ReadonlyMap<
  string,
  readonly ModuleScope[]
> => scopes;

export type ProtectedSourceMatcher = (moduleId: string) => boolean;

// Returns true if `pattern` matches `scope`, using react-router's matchPath:
// "/admin" matches only the exact path; "/admin/*" matches /admin and all nested paths.
export const scopeMatchesPattern = (
  scope: ModuleScope,
  pattern: string,
): boolean => {
  if (scope.type === "route") {
    return matchesProtectedPattern(pattern, joinUrl(scope.path));
  }
  // Subtree scopes only match patterns with '*' (e.g. '/*') to require explicit descendant gating, like react-router.
  const root = joinUrl(scope.root);
  if (!pattern.includes("*")) {
    return matchesProtectedPattern(pattern, root);
  }
  return matchPath({ path: pattern, end: false }, root) != null;
};

// Returns true if a module ID is gated by any configured protected pattern.
// Populates registry automatically or via registerProtectedScope.
export const getProtectedSourceMatcher = (
  config: ConfigWithMeta,
): { match: ProtectedSourceMatcher; enabled: boolean; patterns: string[] } => {
  const protectedRoutes = ProtectedRoutesSchema.parse(config.protectedRoutes);
  const patterns = protectedRoutes ? Object.keys(protectedRoutes) : [];
  if (patterns.length === 0) {
    return { match: () => false, enabled: false, patterns };
  }
  return {
    enabled: true,
    patterns,
    match: (id) => {
      const pathOnly = id.split("?")[0] ?? id;
      const moduleScopes = scopes.get(pathOnly);
      if (!moduleScopes) return false;
      return moduleScopes.some((s) =>
        patterns.some((p) => scopeMatchesPattern(s, p)),
      );
    },
  };
};

// Finds patterns not matched by any registered module scope. Indicates typos or missing registerProtectedScope calls.
export const findUnmatchedProtectedPatterns = (patterns: string[]): string[] =>
  patterns.filter(
    (p) =>
      ![...scopes.values()].some((scopeList) =>
        scopeList.some((s) => scopeMatchesPattern(s, p)),
      ),
  );
