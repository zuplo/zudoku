import { type Plugin } from "vite";

const viteConfigPlugin = (configPath: string): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return configPath;
      }
    },
  };
};

export default viteConfigPlugin;
