import path from "node:path";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const viteAliasPlugin = (): Plugin => {
  return {
    name: "zudoku-component-plugin",
    config: () => {
      const config = getCurrentConfig();

      const replacements = [
        ["zudoku/components", "src/lib/components/index.ts"],
        ["zudoku/plugins/openapi", "src/lib/plugins/openapi/index.tsx"],
        ["zudoku/plugins/api-catalog", "src/lib/plugins/api-catalog/index.tsx"],
        [
          "zudoku/plugins/search-inkeep",
          "src/lib/plugins/search-inkeep/index.tsx",
        ],
        [
          "zudoku/plugins/search-pagefind",
          "src/lib/plugins/search-pagefind/index.tsx",
        ],
        [/^zudoku\/ui\/(.*)\.js/, "src/lib/ui/$1.tsx"],
      ] as const;

      const aliases = replacements.map(([find, replacement]) => ({
        find,
        replacement: path.posix.join(config.__meta.moduleDir, replacement),
      }));

      return config.__meta.mode === "internal" ||
        config.__meta.mode === "standalone"
        ? { resolve: { alias: aliases } }
        : undefined;
    },
  };
};

export default viteAliasPlugin;
