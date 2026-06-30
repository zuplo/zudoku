import { getCurrentConfig } from "../config/loader.js";
import { selectPluginConfigs } from "../lib/core/plugin-config.js";

export type { ConfigEnv, Plugin, PluginOption, UserConfig } from "vite";
export { defineConfig, mergeConfig } from "vite";
export { joinUrl } from "../lib/util/joinUrl.js";
export { getCurrentConfig as getZudokuConfig };

// Read configs of all plugins registered with `createPlugin(name, ...)`. Used by
// a companion Vite plugin to preprocess inputs at build time.
export const getPluginConfigs = <V>(name: string): V[] =>
  selectPluginConfigs<V>(getCurrentConfig().plugins ?? [], name);
