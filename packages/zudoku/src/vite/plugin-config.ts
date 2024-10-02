import { type Plugin } from "vite";
import { getConfigFilePath, type LoadedConfig } from "./config.js";

const viteConfigPlugin = (config: LoadedConfig): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return getConfigFilePath(config.__meta.rootDir);
      }
    },
  };
};

export default viteConfigPlugin;
