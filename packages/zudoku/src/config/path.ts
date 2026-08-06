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

const DOCS_URL = "https://zudoku.dev/docs/configuration/create-path";

// Tracks the absolute paths created during a single config evaluation so the
// same mount point can't be declared twice. This is module-level state, but it
// is only written while the config module is being evaluated (never per
// request) and is cleared on the next microtask — i.e. once the synchronous
// evaluation pass finishes — so a re-evaluation (dev reload) always starts
// clean and the registry never holds state between requests.
const registry = new Set<string>();
let resetScheduled = false;

const scheduleReset = () => {
  if (resetScheduled) return;
  resetScheduled = true;
  queueMicrotask(() => {
    registry.clear();
    resetScheduled = false;
  });
};

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
 * Creating the same **absolute** path twice throws, since two things can't be
 * mounted at the same route. Relative segments may repeat — they are building
 * blocks meant to be composed under different bases.
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

  // Only absolute paths are mount points that must be unique. Relative segments
  // are composed under a base (see `joinUrl`) and may legitimately repeat.
  if (path.startsWith("/")) {
    if (registry.has(path)) {
      throw new ZudokuError(
        `createPath("${path}") was called more than once — each route path can only be mounted once.`,
        {
          title: "Duplicate path",
          developerHint: `Create the path a single time and reuse the returned value, e.g. \`const apiReference = createPath("${path}")\`, then reference \`apiReference\` everywhere. Learn more: ${DOCS_URL}`,
        },
      );
    }

    registry.add(path);
    scheduleReset();
  }

  return path as PathReference;
};
