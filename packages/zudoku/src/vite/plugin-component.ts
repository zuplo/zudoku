import path from "node:path";
import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

const viteAliasPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  return {
    name: "zudoku-component-plugin",
    config: () => {
      const config = getConfig();

      const replacements = [
        ["zudoku/openapi-worker", "src/lib/plugins/openapi-worker.ts"],
        ["zudoku/components", "src/lib/components/index.ts"],
        ["zudoku/plugins/openapi", "src/lib/plugins/openapi/index.tsx"],
        [
          "zudoku/plugins/search-inkeep",
          "src/lib/plugins/search-inkeep/index.tsx",
        ],
        [/^zudoku\/ui\/(.*)\.js/, "src/lib/ui/$1.tsx"],
      ] as const;

      const aliases = replacements.map(([find, replacement]) => ({
        find,
        replacement: path.posix.join(config.moduleDir, replacement),
      }));

      return config.mode === "internal" || config.mode === "standalone"
        ? { resolve: { alias: aliases } }
        : undefined;
    },
  };
};

export default viteAliasPlugin;
