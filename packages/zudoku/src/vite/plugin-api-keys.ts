import { type Plugin } from "vite";
import type { LoadedConfig } from "./config.js";

const viteApiKeysPlugin = (getConfig: () => LoadedConfig): Plugin => {
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

        if (!config.apiKeys || process.env.ZUDOKU_ENV === "standalone") {
          return `export const configuredApiKeysPlugin = undefined;`;
        }

        const code = [
          `const config = ${JSON.stringify(config.apiKeys, null, 2)};`,
          process.env.ZUDOKU_ENV === "internal"
            ? `import { apiKeyPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/api-keys/index.tsx";`
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
