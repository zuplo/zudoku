import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { SidebarManager } from "../config/validators/SidebarSchema.js";
import { writePluginDebugCode } from "./debug.js";

const matchIconAnnotation = /"icon":\s*"(.*?)"/g;

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

const replaceSidebarIcons = (code: string) => {
  const collectedIcons = new Set<string>();

  let match;
  while ((match = matchIconAnnotation.exec(code)) !== null) {
    collectedIcons.add(match[1]!);
  }

  const importStatement = `import { ${[...collectedIcons].map(toPascalCase).join(", ")} } from "zudoku/icons";`;
  const replacedString = code.replaceAll(
    matchIconAnnotation,
    // The element will be created by the implementers side
    (_, iconName) => `"icon": ${toPascalCase(iconName)}`,
  );

  return `${importStatement}export const configuredSidebar = ${replacedString};`;
};

export const viteSidebarPlugin = (
  getConfig: () => ZudokuPluginOptions,
): Plugin => {
  const virtualModuleId = "virtual:zudoku-sidebar";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "zudoku-sidebar-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return;
      const config = getConfig();

      const manager = new SidebarManager(config.rootDir, config.sidebar);
      const resolvedSidebars = await manager.resolveSidebars();

      const code = JSON.stringify(resolvedSidebars);
      await writePluginDebugCode(
        config.rootDir,
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
