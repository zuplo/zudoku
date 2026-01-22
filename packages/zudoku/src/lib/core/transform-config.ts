import createDeepmerge from "@fastify/deepmerge";
import type { ConfigWithMeta } from "../../config/loader.js";
import { type ConfigHookContext, isConfigPlugin } from "./plugins.js";

const mergeConfig = createDeepmerge();

export const runTransformConfigHooks = async (
  config: ConfigWithMeta,
): Promise<ConfigWithMeta> => {
  const plugins = config.plugins ?? [];
  const ctx: ConfigHookContext = {
    mode: config.__meta.mode,
    rootDir: config.__meta.rootDir,
    configPath: config.__meta.configPath,
  };

  let result = config;

  for (const plugin of plugins.filter(isConfigPlugin)) {
    const partial = await plugin.transformConfig?.(result, ctx);
    if (!partial) continue;

    result = mergeConfig(result, partial) as ConfigWithMeta;
  }

  return result;
};
