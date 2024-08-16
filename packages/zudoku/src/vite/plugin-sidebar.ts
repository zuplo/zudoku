import { Plugin } from "vite";
import { ZudokuPluginOptions } from "../config/config.js";
import { resolveSidebar } from "../config/validators/SidebarSchema.js";

export const viteSidebarPlugin = (config: ZudokuPluginOptions): Plugin => {
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

      const resolvedSidebar = Object.fromEntries(
        await Promise.all(
          Object.entries(config.sidebar ?? {}).map(async ([id, sidebar]) => [
            id,
            await resolveSidebar(config.rootDir, id, sidebar),
          ]),
        ),
      );

      return `export const configuredSidebar = ${JSON.stringify(resolvedSidebar)};`;
    },
  };
};
