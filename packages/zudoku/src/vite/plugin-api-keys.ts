import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";

const viteApiKeysPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-api-keys-plugin";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  return {
    name: "zudoku-api-keys-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();

        if (!config.apiKeys || config.mode === "standalone") {
          return `export const configuredApiKeysPlugin = undefined;`;
        }

        const code = [
          `const config = ${JSON.stringify(config.apiKeys, null, 2)};`,
          config.mode === "internal"
            ? `import { apiKeyPlugin } from "${config.moduleDir}/src/lib/plugins/api-keys/index.tsx";`
            : `import { apiKeyPlugin } from "zudoku/plugins/api-keys";`,
          `export const configuredApiKeysPlugin = apiKeyPlugin(config);`,
        ];

        return {
          code: code.join("\n"),
          map: null,
        };
      }
    },
  };
};

export default viteApiKeysPlugin;
