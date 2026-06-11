import { normalizePath, type Plugin, type ResolvedConfig } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const virtualModuleId = "virtual:zudoku-config";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

// The raw config with `extends` resolved, but without plugin `transformConfig`
// hooks applied. The SSR build uses this as the `zudoku.config.js` entry so the
// prerender worker sees the same merged config as the loader, and applies the
// transform + schema parse itself.
export const rawVirtualModuleId = "virtual:zudoku-raw-config";
const resolvedRawVirtualModuleId = `\0${rawVirtualModuleId}`;

const viteConfigPlugin = (): Plugin => {
  let viteConfig: ResolvedConfig;

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      if (id === rawVirtualModuleId) return resolvedRawVirtualModuleId;
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId && id !== resolvedRawVirtualModuleId)
        return;

      const { configPath, extendedConfigPaths } = getCurrentConfig().__meta;
      if (!configPath) {
        return `export default {};`;
      }

      if (id === resolvedRawVirtualModuleId) {
        if (extendedConfigPaths.length === 0) {
          return `export { default } from "${normalizePath(configPath)}";`;
        }

        return [
          `import config from "${normalizePath(configPath)}";`,
          ...extendedConfigPaths.map(
            (extendPath, i) =>
              `import extended${i} from "${normalizePath(extendPath)}";`,
          ),
          `import { mergeConfigExtends } from "zudoku/plugins";`,
          "",
          `export default mergeConfigExtends([${extendedConfigPaths
            .map((_, i) => `extended${i}`)
            .join(", ")}], config);`,
        ].join("\n");
      }

      return `
import rawConfig from "${rawVirtualModuleId}";
import { runPluginTransformConfig } from "zudoku/plugins";

const config = await runPluginTransformConfig(rawConfig);
export default config;
`;
    },
    async transform(code, id) {
      const { configPath, extendedConfigPaths } = getCurrentConfig().__meta;
      if (id !== configPath && !extendedConfigPaths.includes(id)) return;

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
