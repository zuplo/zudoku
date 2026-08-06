import path from "node:path";
import {
  getPackageJson,
  getZudokuPackageJson,
} from "../cli/common/package-json.js";
import { findPackageRoot } from "./package-root.js";

// Optional peer deps whose enablement comes from the build env, not the
// project's package.json (e.g. Sentry is gated on SENTRY_DSN). Externalizing
// these based on package.json absence would break those env-driven builds.
const ENV_GATED_DEPS = new Set(["@sentry/react"]);

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matches the package itself and any subpath (e.g. firebase, firebase/app).
export const optionalDepExternal = (dep: string) =>
  new RegExp(`^${escapeRegExp(dep)}(/.*)?$`);

// Optional peer deps zudoku declares, minus the env-gated ones. This is the
// source of truth so the list can't drift from package.json.
export const getOptionalPeerDeps = (): string[] =>
  Object.entries(getZudokuPackageJson().peerDependenciesMeta ?? {})
    .filter(([name, meta]) => meta?.optional && !ENV_GATED_DEPS.has(name))
    .map(([name]) => name);

const getDeclaredDeps = (pkgRoot: string): Set<string> => {
  try {
    const pkg = getPackageJson(path.join(pkgRoot, "package.json"));
    return new Set(
      DEP_FIELDS.flatMap((field) => Object.keys(pkg[field] ?? {})),
    );
  } catch {
    return new Set();
  }
};

// Externalize optional peers the project did not declare. Undeclared means the
// project doesn't use the feature, so its dynamic import fails gracefully at
// runtime instead of bloating (or breaking) the build.
export const computeOptionalExternals = (
  optionalDeps: string[],
  declared: ReadonlySet<string>,
): RegExp[] =>
  optionalDeps.filter((dep) => !declared.has(dep)).map(optionalDepExternal);

export const getOptionalExternals = async (dir: string): Promise<RegExp[]> => {
  const pkgRoot = await findPackageRoot(dir);
  const declared = pkgRoot ? getDeclaredDeps(pkgRoot) : new Set<string>();
  return computeOptionalExternals(getOptionalPeerDeps(), declared);
};
