import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const viteCustomPagesPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-custom-pages-plugin";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    name: "zudoku-custom-pages-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getCurrentConfig();

        if (config.__meta.mode === "standalone" || !config.navigation) {
          return `export const configuredCustomPagesPlugin = undefined;`;
        }

        const code = [
          `import config from "virtual:zudoku-config";`,
          config.__meta.mode === "internal"
            ? `import { customPagesPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/custom-pages/index.tsx";`
            : `import { customPagesPlugin } from "zudoku/plugins/custom-pages";`,
          `export const configuredCustomPagesPlugin = customPagesPlugin(config.navigation);`,
        ];

        return code.join("\n");
      }
    },
  };
};

export default viteCustomPagesPlugin;
