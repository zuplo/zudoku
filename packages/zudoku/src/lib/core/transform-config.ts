import createDeepmerge from "@fastify/deepmerge";
import type { ConfigWithMeta } from "../../config/loader.js";
import { type ConfigHookContext, isTransformConfigPlugin } from "./plugins.js";

const mergeConfig = createDeepmerge({
  mergeArray: (opt) => (_, source) => opt.clone(source),
});

export const runTransformConfigHooks = async (
  config: ConfigWithMeta,
): Promise<ConfigWithMeta> => {
  const ctx = {
    mode: config.__meta.mode,
    rootDir: config.__meta.rootDir,
    configPath: config.__meta.configPath,
  } satisfies ConfigHookContext;
  const plugins = config.plugins ?? [];

  let result = config;

  for (const plugin of plugins.filter(isTransformConfigPlugin)) {
    const partial = await plugin.transformConfig?.(result, ctx);
    if (!partial) continue;

    result = mergeConfig(result, partial) as ConfigWithMeta;
  }

  return result;
};
