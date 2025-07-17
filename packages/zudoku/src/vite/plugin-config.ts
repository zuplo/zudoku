import type { Plugin, ResolvedConfig } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const viteConfigPlugin = (): Plugin => {
  const virtualModuleId = "virtual:zudoku-config";

  let viteConfig: ResolvedConfig;

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return getCurrentConfig().__meta.configPath;
      }
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    async transform(code, id) {
      if (id !== getCurrentConfig().__meta.configPath) return;

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

          const value =
            viteConfig.define?.[`process.env.${envVar}`] ??
            viteConfig.define?.[`import.meta.env.${envVar}`];

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
