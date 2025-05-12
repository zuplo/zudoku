import { type Plugin, type ResolvedConfig } from "vite";
import type { LoadedConfig } from "../config/config.js";

const viteConfigPlugin = (getConfig: () => LoadedConfig): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  let viteConfig: ResolvedConfig;

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return getConfig().__meta.configPath;
      }
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    async transform(code, id) {
      if (id !== getConfig().__meta.configPath) return;

      const replacedCode = code.replaceAll(
        /process\.env\.([a-z_][a-z0-9_]*)/gi,
        (_, envVar) => {
          const allowedPrefixes = Array.isArray(viteConfig.envPrefix)
            ? viteConfig.envPrefix
            : [viteConfig.envPrefix];

          if (!allowedPrefixes.some((prefix) => envVar.startsWith(prefix))) {
            viteConfig.logger.warn(
              `Warning: process.env.${envVar} is not prefixed with ${allowedPrefixes.join(
                " or ",
              )}.`,
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

      return { code: replacedCode, map: null };
    },
  };
};

export default viteConfigPlugin;
