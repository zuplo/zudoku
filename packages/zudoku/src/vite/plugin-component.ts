import { PluginOption } from "vite";
import { ZudokuPluginOptions } from "../config/config.js";

const viteAliasPlugin = (config: ZudokuPluginOptions): PluginOption => {
  return {
    name: "zudoku-component-plugin",
    config: () =>
      config.mode === "internal" || config.mode === "standalone"
        ? {
            resolve: {
              alias: {
                "zudoku/components": `${config.moduleDir}/src/lib/components/index.ts`,
                "zudoku/internal": `${config.moduleDir}/src/internal.ts`,
                "zudoku/openapi-worker": `${config.moduleDir}/src/lib/plugins/openapi/client/createWorkerClient.ts`,
                "zudoku/plugins/custom-page": `${config.moduleDir}/src/lib/plugins/custom-page/index.tsx`,
                "zudoku/plugins/openapi": `${config.moduleDir}/src/lib/plugins/openapi/index.tsx`,
                "zudoku/plugins/search-inkeep": `${config.moduleDir}/src/lib/plugins/search-inkeep/index.tsx`,
              },
            },
          }
        : undefined,
  };
};

export default viteAliasPlugin;
