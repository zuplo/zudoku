import { readFileSync } from "node:fs";

// Minimal representation of a package.json file
type PackageJson = {
  name: string;
  version: string;
  type: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

export const getPackageJson = (path: string): PackageJson =>
  JSON.parse(readFileSync(path, "utf-8")) as PackageJson;
