import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { resolveSidebar } from "../config/validators/SidebarSchema.js";
import { writePluginDebugCode } from "./debug.js";
import { replaceSidebarIcons } from "./plugin-icons.js";

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

      const resolvedSidebar = Object.fromEntries(
        await Promise.all(
          Object.entries(config.sidebar ?? {}).map(
            async ([parentId, sidebar]) => [
              parentId,
              await resolveSidebar(config.rootDir, sidebar),
            ],
          ),
        ),
      );

      const code = JSON.stringify(resolvedSidebar);
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
