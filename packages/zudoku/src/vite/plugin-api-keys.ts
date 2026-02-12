import type { Plugin } from "vite";
import { ZuploEnv } from "../app/env.js";
import { getCurrentConfig } from "../config/loader.js";
import { getZuploSystemConfigurations } from "./zuplo.js";

const viteApiKeysPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-api-keys-plugin";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    name: "zudoku-api-keys-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getCurrentConfig();

        if (!config.apiKeys || config.__meta.mode === "standalone") {
          return `export const configuredApiKeysPlugin = undefined;`;
        }

        const deploymentName =
          ZuploEnv.buildConfig?.deploymentName ||
          getZuploSystemConfigurations(process.env.ZUPLO_SYSTEM_CONFIGURATIONS)
            ?.__ZUPLO_DEPLOYMENT_NAME;

        const code = [
          `import config from "virtual:zudoku-config";`,
          config.__meta.mode === "internal"
            ? `import { apiKeyPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/api-keys/index.tsx";`
            : `import { apiKeyPlugin } from "zudoku/plugins/api-keys";`,
          `export const configuredApiKeysPlugin = apiKeyPlugin({
            ...config.apiKeys,
            isZuplo: ${ZuploEnv.isZuplo},
            ${deploymentName ? `deploymentName: "${deploymentName}"` : ""}
          });`,
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
