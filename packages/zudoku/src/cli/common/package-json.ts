import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Minimal representation of a package.json file
type PackageJson = {
  name: string;
  version: string;
  type?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export const getPackageJsonPath = (pkg: string) =>
  fileURLToPath(import.meta.resolve(`${pkg}/package.json`)).replaceAll(
    path.sep,
    path.posix.sep,
  );

export const getPackageJson = (pkgPath: string): PackageJson =>
  JSON.parse(readFileSync(pkgPath, "utf-8")) as PackageJson;

export const getZudokuPackageJson = (): PackageJson =>
  getPackageJson(getPackageJsonPath("zudoku"));

export const getZudokuRootDir = () =>
  path.dirname(getPackageJsonPath("zudoku"));
