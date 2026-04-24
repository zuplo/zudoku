import { matchPath } from "react-router";
import type { ConfigWithMeta } from "../../config/loader.js";
import { ProtectedRoutesSchema } from "../../config/validators/ProtectedRoutesSchema.js";

// Output directory for auth-gated chunks. Mirrored in entry.server.tsx's
// protectedAssets middleware.
export const PROTECTED_CHUNK_DIR = "_protected";

// Routes a module contributes to. Populated by the annotator (auto-
// detected shapes) or direct registerProtectedScope calls from plugins.
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

// True when `pattern` covers `scope`. Route scopes match exactly (RR
// matchPath semantics); subtree scopes match when the pattern sits at or
// below the root. The subtree case diverges from runtime matchPath on
// purpose: a plugin registers one module that emits a whole tree of
// routes, and pattern `/admin` should gate them all at build time even
// though RR would require `/admin/*` to match nested paths at runtime.
export const scopeMatchesPattern = (
  scope: ModuleScope,
  pattern: string,
): boolean => {
  if (scope.type === "route") {
    return matchPath({ path: pattern, end: true }, scope.path) != null;
  }
  const root = scope.root.replace(/^\/+|\/+$/g, "");
  const norm = pattern.replace(/\/+$/, "");
  if (!root) return true;
  return (
    norm === `/${root}` ||
    norm.startsWith(`/${root}/`) ||
    (norm.includes("*") &&
      matchPath({ path: norm, end: false }, `/${root}`) != null)
  );
};

// Predicate: is this module id gated by any configured protected pattern?
// Data-driven via the registry; add a new gateable source by populating
// the registry (auto-detected shape or direct registerProtectedScope).
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

// Patterns with no registered module scope: either a typo, or dynamically
// generated protected content missing a registerProtectedScope call (which
// would ship unprotected). Surfaced at build end so it shows up in CI.
export const findUnmatchedProtectedPatterns = (patterns: string[]): string[] =>
  patterns.filter(
    (p) =>
      ![...scopes.values()].some((scopeList) =>
        scopeList.some((s) => scopeMatchesPattern(s, p)),
      ),
  );
