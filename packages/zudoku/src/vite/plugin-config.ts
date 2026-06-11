import path from "node:path";
import { normalizePath, type Plugin, type ResolvedConfig } from "vite";
import { getCurrentConfig } from "../config/loader.js";

const virtualModuleId = "virtual:zudoku-config";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

// The raw config with `extends` layers merged but plugin `transformConfig`
// hooks not yet applied. Layer files become real static imports here so their
// plugin instances are created in the config module's realm (build-time
// virtual modules resolve). Doubles as the SSR build's config entry, which
// the prerender worker re-imports and transforms itself.
export const rawConfigVirtualModuleId = "virtual:zudoku-raw-config";
const resolvedRawConfigVirtualModuleId = `\0${rawConfigVirtualModuleId}`;

const layerImportPath = (importPath: string) =>
  path.isAbsolute(importPath) ? normalizePath(importPath) : importPath;

const viteConfigPlugin = (): Plugin => {
  let viteConfig: ResolvedConfig;

  return {
    name: "zudoku-config-plugin",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      if (id === rawConfigVirtualModuleId)
        return resolvedRawConfigVirtualModuleId;
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    load(id) {
      if (id === resolvedRawConfigVirtualModuleId) {
        const { configPath, configLayers } = getCurrentConfig().__meta;
        if (!configPath) {
          return `export default {};`;
        }

        const imports = configLayers.map(
          (importPath, i) =>
            `import __layer${i} from "${layerImportPath(importPath)}";`,
        );
        const layers = configLayers.map((_, i) => `__layer${i}`);

        return `
import rawConfig from "${normalizePath(configPath)}";
import { resolveExtends } from "zudoku/plugins";
${imports.join("\n")}
export default resolveExtends(rawConfig, [${layers.join(", ")}]);
`;
      }

      if (id === resolvedVirtualModuleId) {
        return `
import rawConfig from "${rawConfigVirtualModuleId}";
import { runPluginTransformConfig } from "zudoku/plugins";

const config = await runPluginTransformConfig(rawConfig);
export default config;
`;
      }
    },
    async transform(code, id) {
      const { configPath, configLayers } = getCurrentConfig().__meta;
      const configFiles = [configPath, ...configLayers].map(layerImportPath);
      if (!configFiles.includes(normalizePath(id))) return;

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
