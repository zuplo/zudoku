import { stringify } from "javascript-stringify";
import { isElement } from "react-is";
import type { Plugin, ViteDevServer } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { IconNames } from "../config/validators/icon-types.js";
import { NavigationResolver } from "../config/validators/NavigationSchema.js";
import invariant from "../lib/util/invariant.js";
import { writePluginDebugCode } from "./debug.js";

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

const virtualModuleId = "virtual:zudoku-navigation";
export const resolvedVirtualModuleId = `\0${virtualModuleId}`;

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

      const resolver = new NavigationResolver(config);
      const resolvedNavigation = await resolver.resolve();
      const resolvedRules = await resolver.resolveRules(
        config.navigationRules ?? [],
      );

      const collectedIcons = new Set<string>();
      let hasMissingIcon = false;

      const stringifyWithIcons = (value: unknown) =>
        stringify(
          value,
          (value, _indent, next, key) => {
            // Skip non-serializable React elements
            if (isElement(value)) return undefined;

            if (key === "icon" && typeof value === "string") {
              const iconName = toPascalCase(value);

              if (!IconNames.includes(value as IconNames)) {
                // biome-ignore lint/suspicious/noConsole: Logging allowed here
                console.warn(
                  `Icon "${value}" not found, see: https://lucide.dev/icons/`,
                );
                hasMissingIcon = true;
                return "MissingIcon";
              } else {
                collectedIcons.add(iconName);
                return iconName;
              }
            }
            return next(value);
          },
          2,
        );

      const navigationCode = stringifyWithIcons(resolvedNavigation);
      const rulesCode = stringifyWithIcons(resolvedRules);

      invariant(navigationCode, "Failed to stringify navigation");
      invariant(rulesCode, "Failed to stringify navigation rules");

      await writePluginDebugCode(
        config.__meta.rootDir,
        "navigation-plugin",
        `navigation: ${navigationCode}\nrules: ${rulesCode}`,
        "js",
      );

      if (hasMissingIcon) {
        collectedIcons.add("MissingIcon");
      }

      const importStatement =
        collectedIcons.size > 0
          ? `import { ${[...collectedIcons].join(", ")} } from "zudoku/icons";\n`
          : "";

      return [
        importStatement,
        `export const configuredNavigation = ${navigationCode};`,
        `export const configuredNavigationRules = ${rulesCode};`,
      ].join("\n");
    },
  };
};
