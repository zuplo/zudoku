import type { Plugin, ResolvedConfig } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const virtualModuleId = "virtual:zudoku-config";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

const viteConfigPlugin = (): Plugin => {
  let viteConfig: ResolvedConfig;

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id !== virtualModuleId) return;

      return resolvedVirtualModuleId;
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;

      return `
import rawConfig from "${getCurrentConfig().__meta.configPath}";
import { runTransformConfigHooks } from "zudoku/__internal";

const config = await runTransformConfigHooks(rawConfig);
export default config;
`;
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
