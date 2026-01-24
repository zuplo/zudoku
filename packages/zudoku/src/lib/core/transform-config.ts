import createDeepmerge from "@fastify/deepmerge";
import type { ConfigWithMeta } from "../../config/loader.js";
import { isTransformConfigPlugin } from "./plugins.js";

const mergeConfig = createDeepmerge({
  mergeArray: (opt) => (_, source) => opt.clone(source),
});

export const runTransformConfigHooks = async (
  config: ConfigWithMeta,
): Promise<ConfigWithMeta> => {
  const plugins = config.plugins ?? [];

  let result = config;

  for (const plugin of plugins.filter(isTransformConfigPlugin)) {
    const partial = await plugin.transformConfig?.(result);
    if (!partial) continue;

    result = mergeConfig(result, partial) as ConfigWithMeta;
  }

  return result;
};
