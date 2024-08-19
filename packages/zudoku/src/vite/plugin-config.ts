import { type Plugin } from "vite";
import { getConfigFilePath } from "./config.js";

const viteConfigPlugin = ({ rootDir }: { rootDir: string }): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return getConfigFilePath(rootDir);
      }
    },
  };
};

export default viteConfigPlugin;
