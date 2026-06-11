import { normalizePath, type Plugin, type ResolvedConfig } from "vite";
import { ZuploEnv } from "../app/env.js";
import { getCurrentConfig } from "../config/loader.js";
import { resolveZuploPackage } from "./zuplo.js";

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

      // In Zuplo mode the config was enriched node-side by @zudoku/zuplo
      // (see `applyZuploEnrichment` in the config loader); apply the identical
      // enrichment to the raw config here so the client sees the same
      // `apis`/`plugins` the build was generated from.
      const zuploEntry = ZuploEnv.isZuplo
        ? resolveZuploPackage(getCurrentConfig().__meta.rootDir)
        : undefined;

      if (zuploEntry) {
        return `
import rawConfig from "${normalizePath(configPath)}";
import { runPluginTransformConfig } from "zudoku/plugins";
import { applyZuploContext } from "${normalizePath(zuploEntry)}";
import zuploContext from "virtual:zudoku-zuplo-context";

const config = await runPluginTransformConfig(applyZuploContext(rawConfig, zuploContext));
export default config;
`;
      }

      return `
import rawConfig from "${normalizePath(configPath)}";
import { runPluginTransformConfig } from "zudoku/plugins";

const config = await runPluginTransformConfig(rawConfig);
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
