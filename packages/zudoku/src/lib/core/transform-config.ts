import { isValidElement } from "react";
import type { ZudokuConfig } from "../../config/validators/validate.js";
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
