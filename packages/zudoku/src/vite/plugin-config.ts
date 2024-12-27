import { type Plugin, type ResolvedConfig } from "vite";
import type { ZudokuPluginOptions } from "../config/config.js";

const viteConfigPlugin = (getConfig: () => ZudokuPluginOptions): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  let viteConfig: ResolvedConfig;

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return getConfig().__meta.path;
      }
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    async transform(code, id) {
      if (id !== getConfig().__meta.path) return;

      return code.replaceAll(
        /process\.env\.([a-z_][a-z0-9_]*)/gi,
        (_, envVar) => {
          if (!envVar.startsWith(viteConfig.envPrefix)) {
            viteConfig.logger.warn(
              `Warning: process.env.${envVar} is not prefixed with ${viteConfig.envPrefix}.`,
            );
            return "undefined";
          }

          const value = viteConfig.define?.[envVar];
          if (value === undefined) {
            viteConfig.logger.warn(
              `Warning: process.env.${envVar} is not defined.`,
            );
            return "undefined";
          }

          return value;
        },
      );
    },
  };
};

export default viteConfigPlugin;
