import { type Plugin } from "vite";
import type { LoadedConfig } from "./config.js";

const viteAliasPlugin = (getConfig: () => LoadedConfig): Plugin => {
  return {
    name: "zudoku-component-plugin",
    config: () => {
      const config = getConfig();
      return process.env.ZUDOKU_ENV === "internal" ||
        process.env.ZUDOKU_ENV === "standalone"
        ? {
            resolve: {
              alias: {
                "zudoku/components": `${config.__meta.moduleDir}/src/lib/components/index.ts`,
                "zudoku/internal": `${config.__meta.moduleDir}/src/internal.ts`,
                "zudoku/openapi-worker": `${config.__meta.moduleDir}/src/lib/plugins/openapi/client/createWorkerClient.ts`,
                "zudoku/plugins/custom-page": `${config.__meta.moduleDir}/src/lib/plugins/custom-page/index.tsx`,
                "zudoku/plugins/openapi": `${config.__meta.moduleDir}/src/lib/plugins/openapi/index.tsx`,
                "zudoku/plugins/search-inkeep": `${config.__meta.moduleDir}/src/lib/plugins/search-inkeep/index.tsx`,
              },
            },
          }
        : undefined;
    },
  };
};

export default viteAliasPlugin;
