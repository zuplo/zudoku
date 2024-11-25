import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

const viteAliasPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  return {
    name: "zudoku-component-plugin",
    config: () => {
      const config = getConfig();

      const replacements = {
        "zudoku/openapi-worker": `${config.moduleDir}/src/lib/plugins/openapi/client/GraphQLClient.tsx`,
        "zudoku/components": `${config.moduleDir}/src/lib/components/index.ts`,
        "zudoku/plugins/openapi": `${config.moduleDir}/src/lib/plugins/openapi/index.tsx`,
        "zudoku/plugins/search-inkeep": `${config.moduleDir}/src/lib/plugins/search-inkeep/index.tsx`,
      };

      const expandedReplacements = Object.entries(replacements).map(
        ([find, replacement]) => ({
          find,
          replacement,
        }),
      );

      return config.mode === "internal" || config.mode === "standalone"
        ? {
            resolve: {
              alias: [
                ...expandedReplacements,
                {
                  find: /^zudoku\/ui\/(.*).js/,
                  replacement: `${config.moduleDir}/src/lib/ui/$1.tsx`,
                },
              ],
            },
          }
        : undefined;
    },
  };
};

export default viteAliasPlugin;
