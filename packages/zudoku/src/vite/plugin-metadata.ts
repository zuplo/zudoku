import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Used for debugging, writes metadata to build.
 */
const viteBuildMetadata = (): Plugin => {
  return {
    name: "zudoku-build-metadata-plugin",
    buildEnd() {
      const deps = [];
      for (const id of this.getModuleIds()) {
        const m = this.getModuleInfo(id);
        if (m != null) {
          for (const target of m.importedIds) {
            deps.push({ source: m.id, target });
          }
        }
      }

      writeFileSync(
        path.join(__dirname, "graph.json"),
        JSON.stringify(deps, null, 2),
      );
    },
  };
};

export default viteBuildMetadata;
