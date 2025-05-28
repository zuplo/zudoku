import { type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";

export const viteSearchPlugin = (): Plugin => {
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

      const config = getCurrentConfig();

      if (!config.search || config.__meta.mode === "standalone") {
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

      if (config.search.type === "pagefind") {
        code.push(
          `import config from 'virtual:zudoku-config';`,
          `import { pagefindSearchPlugin } from "zudoku/plugins/search-pagefind";`,
          `export const configuredSearchPlugin = pagefindSearchPlugin(config.search);`,
        );

        return code.join("\n");
      }
    },
  };
};
