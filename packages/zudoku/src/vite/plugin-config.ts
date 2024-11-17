import { type Plugin } from "vite";
import type { ZudokuPluginOptions } from "../config/config.js";

const viteConfigPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return getConfig().__meta.path;
      }
    },
  };
};

export default viteConfigPlugin;
