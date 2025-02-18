import { writeFile } from "node:fs/promises";
import path from "node:path";
import { type Plugin } from "vite";
import { logger } from "../cli/common/logger.js";

/**
 * Used for debugging, writes metadata to build.
 */
const viteBuildMetadata = (): Plugin => {
  return {
    name: "zudoku-build-metadata-plugin",
    async buildEnd() {
      const deps = [];
      for (const id of this.getModuleIds()) {
        const m = this.getModuleInfo(id);
        if (m != null && !m.isExternal) {
          for (const target of m.importedIds) {
            deps.push({ source: m.id, target });
          }
        }
      }
      try {
        await writeFile(
          path.join(__dirname, "graph.json"),
          JSON.stringify(deps, null, 2),
        );
      } catch (error) {
        logger.error("Error writing graph.json:", error);
      }
    },
  };
};

export default viteBuildMetadata;
