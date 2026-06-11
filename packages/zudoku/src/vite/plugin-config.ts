import { normalizePath, type Plugin, type ResolvedConfig } from "vite";
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

      const configPath = getCurrentConfig().__meta.configPath;
      if (!configPath) {
        return `export default {};`;
      }

      // Base config layers (`extends`) are static imports inside the user's
      // config module, so resolving them here yields the exact same merged
      // config node-side and in the client bundle.
      return `
import rawConfig from "${normalizePath(configPath)}";
import { resolveConfigExtends, runPluginTransformConfig } from "zudoku/plugins";

const config = await runPluginTransformConfig(resolveConfigExtends(rawConfig));
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
