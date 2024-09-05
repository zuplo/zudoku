import { type Plugin } from "vite";
import { type ZudokuPluginOptions } from "../config/config.js";
import { resolveSidebar } from "../config/validators/SidebarSchema.js";
import { replaceSidebarAnnotatedIcons } from "./plugin-icons.js";

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
              await resolveSidebar(config.rootDir, parentId, sidebar),
            ],
          ),
        ),
      );

      return JSON.stringify(resolvedSidebar);
    },
    async transform(code, id) {
      if (id !== resolvedVirtualModuleId) return;

      return replaceSidebarAnnotatedIcons(code);
    },
  };
};
