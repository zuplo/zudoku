import type { IconNames } from "../../../config/validators/icon-types.js";
import type { ZudokuPlugin } from "../../core/plugins.js";

export interface AutoNavigationOptions {
  /**
   * Glob patterns for markdown files to include.
   * Defaults to the `docs.files` config, or `/pages/**\/*.{md,mdx}`.
   */
  files?: string | string[];
  /**
   * Base path prefix stripped from file paths when generating navigation paths.
   * For example, if files are in `/pages/docs/` and basePath is `docs`,
   * the file `/pages/docs/getting-started.md` becomes the nav path `docs/getting-started`.
   * Defaults to auto-detecting the common directory prefix.
   */
  basePath?: string;
  /**
   * Default collapsed state for generated categories.
   * @default undefined (uses Zudoku default)
   */
  collapsed?: boolean;
  /**
   * Default collapsible state for generated categories.
   * @default undefined (uses Zudoku default)
   */
  collapsible?: boolean;
  /**
   * Glob patterns to exclude from navigation.
   */
  exclude?: string[];
  /**
   * Label for the root-level category wrapping all auto-generated items.
   * If not set, items are added at the top level of navigation.
   */
  label?: string;
  /**
   * Icon for the root-level category (when `label` is set).
   */
  icon?: IconNames;
}

/**
 * Plugin that auto-generates sidebar navigation from markdown file structure.
 *
 * Directories become categories, index files become category links, and
 * frontmatter properties (`sidebar_position`, `sidebar_label`, etc.) control
 * ordering and labels.
 *
 * Node.js dependencies (fs, glob) are dynamically imported only when
 * `transformConfig` runs at build time, so this module is safe to import
 * in browser bundles.
 */
export const autoNavigationPlugin = (
  options: AutoNavigationOptions = {},
): ZudokuPlugin => ({
  transformConfig: async ({ config, merge }) => {
    // Dynamic import keeps Node.js deps out of the browser bundle
    const { resolveAutoNavigation } = await import("./resolve.js");

    // biome-ignore lint/suspicious/noExplicitAny: __meta is added at runtime by ConfigWithMeta
    const rootDir = (config as any).__meta?.rootDir ?? process.cwd();

    const navItems = await resolveAutoNavigation(
      options,
      rootDir,
      config.docs?.files,
    );

    if (!navItems) {
      return;
    }

    const existingNav = config.navigation ?? [];
    return merge({
      navigation: [...existingNav, ...navItems],
    });
  },
});
