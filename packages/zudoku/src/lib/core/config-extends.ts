import { isValidElement } from "react";
import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import { isPlainObject } from "./transform-config.js";

/**
 * Merges a higher-precedence config (`overlay`) into a lower-precedence one
 * (`base`): plain objects merge recursively with overlay values winning,
 * arrays concatenate with the overlay's items first, and everything else
 * (React elements, functions, class instances, scalars) is replaced by the
 * overlay value.
 */
const mergeExtendedValue = (base: unknown, overlay: unknown): unknown => {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) {
    return [...overlay, ...base];
  }
  if (
    isPlainObject(base) &&
    isPlainObject(overlay) &&
    !isValidElement(base) &&
    !isValidElement(overlay)
  ) {
    return Object.fromEntries([
      ...Object.entries(base).filter(([key]) => !(key in overlay)),
      ...Object.entries(overlay).map(([key, value]) => [
        key,
        mergeExtendedValue(base[key], value),
      ]),
    ]);
  }
  return overlay;
};

/**
 * Resolves the `extends` chain of a config: base configs are merged in order
 * (later ones take precedence), then the config itself is merged on top with
 * the highest precedence. Arrays are concatenated with higher-precedence
 * items first, so e.g. the user's navigation entries appear before those of
 * extended configs. The `extends` key itself is stripped from the result.
 */
export const mergeConfigExtends = <T extends ZudokuConfig>(
  baseConfigs: ZudokuConfig[],
  config: T,
): T => {
  const merged = [...baseConfigs, config].reduce<unknown>(
    (acc, next) => mergeExtendedValue(acc, next),
    {},
  ) as T;

  const { extends: _, ...rest } = merged as T & { extends?: string[] };
  return rest as T;
};
