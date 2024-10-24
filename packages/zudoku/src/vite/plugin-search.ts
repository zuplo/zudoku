import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

export const viteSearchPlugin = (
  getConfig: () => ZudokuPluginOptions,
): Plugin => {
  const virtualModuleId = "virtual:zudoku-search-plugin";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-search-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getConfig();

      if (!config.search || config.mode === "standalone") {
        return `export const configuredSearchPlugin = undefined;`;
      }

      const code = [];

      if (config.search.type === "inkeep") {
        code.push(
          `import config from 'virtual:zudoku-config';`,
          `import { inkeepSearchPlugin } from "zudoku/plugins/search-inkeep";`,
          `export const configuredSearchPlugin = inkeepSearchPlugin(config.search);`,
        );

        return code.join("\n");
      }
    },
  };
};
