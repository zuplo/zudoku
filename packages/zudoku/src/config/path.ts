import { ZudokuError } from "../lib/util/invariant.js";

declare const pathReferenceBrand: unique symbol;

/**
 * A branded string representing an internal route path.
 *
 * It is a string at runtime, so it can be used anywhere a path string is
 * accepted (e.g. a navigation `link.to` or a plugin's `path`). Define it once
 * with {@link createPath} and reference the same value in both the navigation
 * and the plugin config so the two cannot drift apart.
 */
export type PathReference = string & { readonly [pathReferenceBrand]: never };

/**
 * Defines an internal route path that can be referenced in multiple places.
 *
 * Use it to declare the path a plugin is mounted at once, then reference the
 * returned value from both the plugin config and the navigation link:
 *
 * ```ts
 * import { createPath } from "zudoku";
 *
 * const apiReference = createPath("/api");
 *
 * export default {
 *   navigation: [{ type: "link", to: apiReference, label: "API Reference" }],
 *   apis: { type: "file", input: "./openapi.json", path: apiReference },
 * };
 * ```
 *
 * @param path An absolute path starting with `/`.
 */
export const createPath = (path: string): PathReference => {
  if (!path.startsWith("/")) {
    throw new ZudokuError(`Path "${path}" must start with a "/".`, {
      developerHint:
        "createPath expects an absolute path, e.g. createPath('/api').",
    });
  }

  return path as PathReference;
};
