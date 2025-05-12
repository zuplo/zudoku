import { type Plugin } from "vite";
import { type LoadedConfig } from "../config/config.js";

const viteCustomPagesPlugin = (getConfig: () => LoadedConfig): Plugin => {
  const virtualModuleId = "virtual:zudoku-custom-pages-plugin";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  return {
    name: "zudoku-custom-pages-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const config = getConfig();

        if (!config.customPages || config.__meta.mode === "standalone") {
          return `export const configuredCustomPagesPlugin = undefined;`;
        }

        const code = [
          `import config from "virtual:zudoku-config";`,
          config.__meta.mode === "internal"
            ? `import { customPagesPlugin } from "${config.__meta.moduleDir}/src/lib/plugins/custom-pages/index.tsx";`
            : `import { customPagesPlugin } from "zudoku/plugins/custom-pages";`,
          `export const configuredCustomPagesPlugin = customPagesPlugin(config.customPages);`,
        ];

        return code.join("\n");
      }
    },
  };
};

export default viteCustomPagesPlugin;
