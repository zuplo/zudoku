import type { ConfigWithMeta } from "../../config/loader.js";
import { type ConfigHookContext, isConfigPlugin } from "./plugins.js";

const isObject = (item: unknown): item is Record<string, unknown> =>
  typeof item === "object" && item !== null && !Array.isArray(item);

const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T => {
  const output = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      output[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      output[key] = sourceValue as T[keyof T];
    }
  }

  return output;
};

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

    result = deepMerge(result, partial as Partial<ConfigWithMeta>);
  }

  return result;
};
