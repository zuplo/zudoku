import { isValidElement } from "react";
import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import { isTransformConfigPlugin } from "./plugins.js";

export const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export const mergeConfig = <
  T extends Record<string, unknown>,
  S extends Record<string, unknown>,
>(
  target: T,
  source: S,
): T & S => {
  const result = { ...target } as T & S;

  for (const key of Object.keys(source) as (keyof S)[]) {
    const sourceValue = source[key];
    const targetValue = target[key as keyof T];

    // Don't merge React elements, arrays, or non-plain objects - just replace
    if (
      isValidElement(sourceValue) ||
      Array.isArray(sourceValue) ||
      !isPlainObject(sourceValue)
    ) {
      (result as Record<string, unknown>)[key as string] = sourceValue;
    } else if (isPlainObject(targetValue)) {
      (result as Record<string, unknown>)[key as string] = mergeConfig(
        targetValue,
        sourceValue,
      );
    } else {
      (result as Record<string, unknown>)[key as string] = sourceValue;
    }
  }

  return result;
};

// Merges one config layer on top of another. Unlike plain `mergeConfig`,
// `plugins` are concatenated (layer plugins first) instead of replaced.
const mergeConfigLayer = (
  target: ZudokuConfig,
  source: ZudokuConfig,
): ZudokuConfig => {
  const plugins = [...(target.plugins ?? []), ...(source.plugins ?? [])];
  const merged: ZudokuConfig = mergeConfig(
    target as Record<string, unknown>,
    source as Record<string, unknown>,
  );

  return plugins.length > 0 ? { ...merged, plugins } : merged;
};

/**
 * Folds the `extends` layers of a config left to right, with the config itself
 * applied on top, and strips the `extends` key from the result.
 *
 * Merge semantics: scalars and nested objects from later layers win (the
 * config itself wins over all layers), arrays are replaced — except `plugins`,
 * which are concatenated in layer order with the config's own plugins last.
 * Layers may themselves contain `extends`; they are resolved depth-first.
 */
export const resolveExtends = <T extends ZudokuConfig>(config: T): T => {
  if (!isPlainObject(config) || !Array.isArray(config.extends)) return config;

  const { extends: layers, ...own } = config;

  return [...layers.map(resolveExtends), own].reduce(mergeConfigLayer, {}) as T;
};

export const runPluginTransformConfig = async <T extends ZudokuConfig>(
  config: T,
): Promise<T> => {
  const plugins = config.plugins ?? [];

  let result = config;

  for (const plugin of plugins.filter(isTransformConfigPlugin)) {
    const merge = <T extends Record<string, unknown>>(partial: T) =>
      mergeConfig(result, partial);

    const transformed = await plugin.transformConfig?.({
      config: result,
      merge,
    });
    if (!transformed) continue;

    result = transformed as T;
  }

  return result;
};
