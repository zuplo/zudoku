import { getZudokuConfig, type Plugin } from "zudoku/vite";
import {
  EMPTY_ZUPLO_CONTEXT,
  VIRTUAL_ZUPLO_CONTEXT_ID,
  type ZuploClientContext,
} from "./src/context.js";

/**
 * Serves the Zuplo context that was inspected node-side (stored on the config
 * by `buildZuploConfig`) as `virtual:zudoku-zuplo-context`, so the client
 * bundle applies the exact same enrichment as the build.
 */
export const zuploContextPlugin = (): Plugin => {
  const resolvedVirtualModuleId = `\0${VIRTUAL_ZUPLO_CONTEXT_ID}`;

  return {
    name: "zudoku-zuplo:context",
    resolveId(id) {
      if (id === VIRTUAL_ZUPLO_CONTEXT_ID) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) return;

      const config = getZudokuConfig() as { __zuplo?: ZuploClientContext };
      const context = config.__zuplo ?? EMPTY_ZUPLO_CONTEXT;

      return `export default ${JSON.stringify(context)};`;
    },
  };
};
