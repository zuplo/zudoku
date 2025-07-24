import { stringify } from "javascript-stringify";
import { type Plugin, type ViteDevServer } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { IconNames } from "../config/validators/icon-types.js";
import { NavigationResolver } from "../config/validators/NavigationSchema.js";
import invariant from "../lib/util/invariant.js";
import { writePluginDebugCode } from "./debug.js";

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

const virtualModuleId = "virtual:zudoku-navigation";
export const resolvedVirtualModuleId = "\0" + virtualModuleId;

export const invalidate = (server: ViteDevServer) => {
  const navigationModule =
    server.environments.ssr.moduleGraph.getModuleById(virtualModuleId);
  if (!navigationModule) return;

  server.environments.ssr.moduleGraph.invalidateModule(navigationModule);
};

export const viteNavigationPlugin = (): Plugin => {
  return {
    name: "zudoku-navigation-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const config = getCurrentConfig();

      const resolvedNavigation = await new NavigationResolver(config).resolve();

      const collectedIcons = new Set<string>();

      // This stringifies functions and takes care of the icon replacement
      const code = stringify(
        resolvedNavigation,
        (value, _indent, next, key) => {
          if (key === "icon" && typeof value === "string") {
            const iconName = value;
            if (!IconNames.includes(iconName as IconNames)) {
              // eslint-disable-next-line no-console
              console.warn(
                `Icon ${iconName} not found, see: https://lucide.dev/icons/`,
              );
              collectedIcons.add("MissingIcon as " + toPascalCase(iconName));
              return `MissingIcon as ${toPascalCase(iconName)}`;
            } else {
              collectedIcons.add(toPascalCase(iconName));
              return toPascalCase(iconName);
            }
          }
          return next(value);
        },
        2,
      );

      invariant(code, "Failed to stringify navigation");

      await writePluginDebugCode(
        config.__meta.rootDir,
        "navigation-plugin",
        code,
        "js",
      );

      const importStatement =
        collectedIcons.size > 0
          ? `import { ${[...collectedIcons].join(", ")} } from "zudoku/icons";\n`
          : "";

      return [
        importStatement,
        `export const configuredNavigation = ${code};`,
      ].join("\n");
    },
  };
};
