import { readFile } from "node:fs/promises";
import path from "node:path";
import { findPackageRoot } from "../vite/package-root.js";

export type PluginVersion = { name: string; version: string };

// Reads the `name`@`version` from each plugin dir's nearest package.json,
// deduped by package name.
export const getPluginVersions = async (
  pluginDirs: readonly string[],
): Promise<PluginVersion[]> => {
  const roots = await Promise.all(
    [...new Set(pluginDirs)].map(findPackageRoot),
  );

  const resolved = await Promise.all(
    roots.map(async (root): Promise<PluginVersion | undefined> => {
      if (!root) return undefined;
      try {
        const pkg = JSON.parse(
          await readFile(path.join(root, "package.json"), "utf-8"),
        ) as { name?: string; version?: string };
        if (!pkg.name) return undefined;
        return { name: pkg.name, version: pkg.version ?? "unknown" };
      } catch {
        // A plugin without a readable package.json simply isn't reported.
        return undefined;
      }
    }),
  );

  const byName = new Map<string, PluginVersion>();
  for (const version of resolved) {
    if (version && !byName.has(version.name)) byName.set(version.name, version);
  }

  return [...byName.values()];
};
