import { stringify } from "javascript-stringify";
import { isElement } from "react-is";
import type { Plugin, ViteDevServer } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { NavigationResolver } from "../config/validators/NavigationSchema.js";
import invariant from "../lib/util/invariant.js";
import { writePluginDebugCode } from "./debug.js";
import { IconRegistry } from "./icon-registry.js";

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

      const icons = new IconRegistry();

      const stringifyNavigation = (value: unknown) =>
        stringify(
          value,
          (value, _indent, next, key) => {
            if (isElement(value)) return undefined;
            if (key === "icon" && typeof value === "string") {
              icons.add(value);
            }
            return next(value);
          },
          2,
        );

      const headerNavigationCode = stringifyNavigation(
        config.header?.navigation ?? [],
      );
      const navigationCode = stringifyNavigation(resolvedNavigation);
      const rulesCode = stringifyNavigation(resolvedRules);

      invariant(headerNavigationCode, "Failed to stringify header navigation");
      invariant(navigationCode, "Failed to stringify navigation");
      invariant(rulesCode, "Failed to stringify navigation rules");

      await writePluginDebugCode(
        config.__meta.rootDir,
        "navigation-plugin",
        `export const headerNavigation = ${headerNavigationCode};\nexport const navigation = ${navigationCode};\nexport const rules = ${rulesCode};`,
        "js",
      );

      return [
        icons.toImports(),
        `export const configuredHeaderNavigation = ${headerNavigationCode};`,
        `export const configuredNavigation = ${navigationCode};`,
        `export const configuredNavigationRules = ${rulesCode};`,
      ].join("\n");
    },
  };
};
