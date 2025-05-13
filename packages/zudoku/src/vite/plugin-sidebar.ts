import icons from "lucide-react/dist/esm/dynamicIconImports.js";
import { type Plugin, type ViteDevServer } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { SidebarManager } from "../config/validators/SidebarSchema.js";
import { writePluginDebugCode } from "./debug.js";

const matchIconAnnotation = /"icon":\s*"(.*?)"/g;

const iconNames = Object.keys(icons);

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

const replaceSidebarIcons = (code: string) => {
  const collectedIcons = new Set<string>();

  let match;
  while ((match = matchIconAnnotation.exec(code)) !== null) {
    if (!iconNames.includes(match[1]!)) {
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

  return `${importStatement}export const configuredSidebar = ${replacedString};`;
};

const virtualModuleId = "virtual:zudoku-sidebar";
export const resolvedVirtualModuleId = "\0" + virtualModuleId;

export const invalidate = (server: ViteDevServer) => {
  const sidebarModule =
    server.environments.ssr.moduleGraph.getModuleById(virtualModuleId);
  if (!sidebarModule) return;

  server.environments.ssr.moduleGraph.invalidateModule(sidebarModule);
};

export const viteSidebarPlugin = (): Plugin => {
  return {
    name: "zudoku-sidebar-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const config = getCurrentConfig();

      const manager = new SidebarManager(
        config.__meta.rootDir,
        config.navigation,
      );
      const resolvedSidebars = await manager.resolveSidebars();

      const code = JSON.stringify(resolvedSidebars);
      await writePluginDebugCode(
        config.__meta.rootDir,
        "sidebar-plugin",
        code,
        "json",
      );

      return code;
    },
    async transform(code, id) {
      if (id !== resolvedVirtualModuleId) return;

      // In the stringified config all occurrences of icons are replaced with icon components
      // and their imports are added to the top.
      // They will be created as elements when the sidebar is rendered.
      return replaceSidebarIcons(code);
    },
  };
};
