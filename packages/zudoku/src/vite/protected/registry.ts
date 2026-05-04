import { matchPath } from "react-router";
import type { ConfigWithMeta } from "../../config/loader.js";
import { ProtectedRoutesSchema } from "../../config/validators/ProtectedRoutesSchema.js";
import { joinUrl } from "../../lib/util/joinUrl.js";

// Output directory for auth-gated chunks. Mirrored in entry.server.tsx's protectChunks middleware.
export const PROTECTED_CHUNK_DIR = "_protected";

// Routes a module contributes to. Populated by the annotator (auto-detected shapes)
// or direct registerProtectedScope calls from plugins.
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

// True when `pattern` covers `scope`, using react-router matchPath
// semantics so build-time gating mirrors runtime behavior. A bare pattern
// like "/admin" only matches the exact path; "/admin/*" matches /admin
// and all descendants.
export const scopeMatchesPattern = (
  scope: ModuleScope,
  pattern: string,
): boolean => {
  if (scope.type === "route") {
    return matchPath({ path: pattern, end: true }, joinUrl(scope.path)) != null;
  }
  // Subtree scopes require an explicit glob pattern so the user opts in
  // to descendant gating, mirroring how react-router needs `/*` to match
  // nested paths.
  const root = joinUrl(scope.root);
  if (!pattern.includes("*")) {
    return matchPath({ path: pattern, end: true }, root) != null;
  }
  return matchPath({ path: pattern, end: false }, root) != null;
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
