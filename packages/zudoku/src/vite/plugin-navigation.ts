import { type Plugin, type ViteDevServer } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { IconNames } from "../config/validators/icon-types.js";
import { NavigationResolver } from "../config/validators/NavigationSchema.js";
import { writePluginDebugCode } from "./debug.js";

const matchIconAnnotation = /"icon":\s*"(.*?)"/g;

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

const replaceNavigationIcons = (code: string) => {
  const collectedIcons = new Set<string>();

  let match;
  while ((match = matchIconAnnotation.exec(code)) !== null) {
    if (!IconNames.includes(match[1]! as IconNames)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Icon ${match[1]!} not found, see: https://lucide.dev/icons/`,
      );
      collectedIcons.add("MissingIcon as " + toPascalCase(match[1]!));
    } else {
      collectedIcons.add(toPascalCase(match[1]!));
    }
  }

  const importStatement = `import { ${[...collectedIcons].join(", ")} } from "zudoku/icons";`;
  const replacedString = code.replaceAll(
    matchIconAnnotation,
    // The element will be created by the implementers side
    (_, iconName) => `"icon": ${toPascalCase(iconName)}`,
  );

  return [
    importStatement,
    `export const configuredNavigation = ${replacedString};`,
  ].join("\n");
};

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

      const code = JSON.stringify(resolvedNavigation);
      await writePluginDebugCode(
        config.__meta.rootDir,
        "navigation-plugin",
        code,
        "json",
      );

      return code;
    },
    async transform(code, id) {
      if (id !== resolvedVirtualModuleId) return;

      // In the stringified config all occurrences of icons are replaced with icon components
      // and their imports are added to the top.
      // They will be created as elements when the navigation is rendered.
      return replaceNavigationIcons(code);
    },
  };
};
