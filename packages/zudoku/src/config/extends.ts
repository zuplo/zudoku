import type { ZudokuConfig } from "./validators/ZudokuConfig.js";

// Keys holding per-instance entries that accumulate across layers instead of
// being overridden (base layers first, so later layers render on top).
const CONCAT_KEYS = new Set(["plugins", "apis"]);

const ensureArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

// Only merge plain data objects. Class instances, React elements
// (`$$typeof`) and the like are opaque leaf values an overlay replaces.
const isMergeableObject = (
  value: unknown,
): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  if ("$$typeof" in value) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const mergeValues = (base: unknown, overlay: unknown): unknown => {
  if (overlay === undefined) return base;
  if (base === undefined) return overlay;
  if (isMergeableObject(base) && isMergeableObject(overlay)) {
    return Object.fromEntries(
      [...new Set([...Object.keys(base), ...Object.keys(overlay)])].map(
        (key) => [key, mergeValues(base[key], overlay[key])],
      ),
    );
  }
  return overlay;
};

const mergeLayers = <T extends object>(baseLayer: T, overlayLayer: T): T => {
  const base = baseLayer as Record<string, unknown>;
  const overlay = overlayLayer as Record<string, unknown>;

  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(overlay)])].map((key) => {
      if (CONCAT_KEYS.has(key) && base[key] && overlay[key]) {
        return [key, [...ensureArray(base[key]), ...ensureArray(overlay[key])]];
      }
      return [key, mergeValues(base[key], overlay[key])];
    }),
  ) as T;
};

/**
 * Resolves the `extends` layers of a config into a single flat config.
 *
 * Layers are merged in order with the extending config applied last, so it
 * wins on conflicts. Plain objects are merged recursively; `plugins` and
 * `apis` entries are concatenated (base layers first); all other values are
 * replaced by the topmost layer that sets them.
 *
 * Runs both node-side (config loading) and in the client bundle, so it must
 * stay environment-agnostic.
 */
export const resolveConfigExtends = <T extends ZudokuConfig>(
  config: T,
): Omit<T, "extends"> => {
  // Leave invalid configs (e.g. a null default export) to validateConfig
  if (typeof config !== "object" || config === null) return config;

  const { extends: layers, ...rest } = config;
  if (!layers || layers.length === 0) return rest;

  return [...layers.map((layer) => resolveConfigExtends(layer)), rest].reduce(
    mergeLayers,
  ) as Omit<T, "extends">;
};
