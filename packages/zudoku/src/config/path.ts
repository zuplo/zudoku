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
 * The value can be an absolute path (`"/api"`) or a relative segment
 * (`"api-users"`) that is composed with {@link joinUrl}:
 *
 * ```ts
 * import { createPath, joinUrl } from "zudoku";
 *
 * const catalog = createPath("/catalog");
 * const usersApi = joinUrl(catalog, "api-users"); // "/catalog/api-users"
 * ```
 *
 * @param path A non-empty path string (an absolute path or a relative segment).
 */
export const createPath = (path: string): PathReference => {
  if (path.length === 0) {
    throw new ZudokuError("createPath requires a non-empty path.", {
      developerHint:
        "Pass an absolute path like createPath('/api') or a segment like createPath('api-users').",
    });
  }

  return path as PathReference;
};
