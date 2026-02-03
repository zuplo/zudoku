import path from "node:path";
import type { LoadContext, Plugin } from "@docusaurus/types";
import { normalizeUrl } from "@docusaurus/utils";
import type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

export type { ZudokuApiReferenceConfiguration } from "@zudoku/core";

export type ZudokuDocusaurusOptions = {
  /** Label for the navbar link */
  label?: string;
  /** Route path for the documentation (default: '/api-docs') */
  route?: string;
  /** Whether to show a link in the navbar (default: true) */
  showNavLink?: boolean;
  /** CDN URL for Zudoku (optional) */
  cdn?: string;
  /** Zudoku configuration */
  configuration?: ZudokuApiReferenceConfiguration;
};

const DEFAULT_CONFIGURATION: Partial<ZudokuApiReferenceConfiguration> = {
  _integration: "docusaurus",
};

/**
 * Creates default options by merging with user-provided options
 */
const createDefaultOptions = (
  options: ZudokuDocusaurusOptions,
): ZudokuDocusaurusOptions => ({
  showNavLink: true,
  label: "API Reference",
  route: "/api-docs",
  ...options,
  configuration: {
    ...DEFAULT_CONFIGURATION,
    ...(options.configuration ?? {}),
  },
});

/**
 * Docusaurus plugin for Zudoku API documentation
 *
 * @example docusaurus.config.js
 * ```javascript
 * module.exports = {
 *   plugins: [
 *     ['@zudoku/docusaurus', {
 *       label: 'API Reference',
 *       route: '/api-docs',
 *       configuration: {
 *         spec: {
 *           url: '/openapi.json'
 *         }
 *       }
 *     }]
 *   ]
 * }
 * ```
 */
export default function ZudokuDocusaurus(
  context: LoadContext,
  options: ZudokuDocusaurusOptions,
): Plugin<{ configuration?: ZudokuApiReferenceConfiguration }> {
  const defaultOptions = createDefaultOptions(options);
  const { baseUrl } = context.siteConfig;

  return {
    name: "@zudoku/docusaurus",

    /**
     * Inject Zudoku scripts into the page
     */
    injectHtmlTags() {
      return {
        preBodyTags: [
          {
            tagName: "script",
            attributes: {
              src:
                options.cdn ??
                "https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/main.js",
              type: "module",
            },
          },
        ],
        headTags: [
          {
            tagName: "link",
            attributes: {
              rel: "stylesheet",
              href:
                options.cdn?.replace("main.js", "style.css") ??
                "https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/style.css",
            },
          },
        ],
      };
    },

    loadContent() {
      return defaultOptions;
    },

    contentLoaded({ content, actions }) {
      const { addRoute } = actions;

      // Add navbar link if configured
      if (defaultOptions.showNavLink) {
        const navbar = context.siteConfig.themeConfig.navbar as {
          items: Array<Record<string, string>>;
        };
        navbar.items.push({
          to: normalizeUrl([baseUrl, defaultOptions.route ?? "/api-docs"]),
          label: defaultOptions.label ?? "API Reference",
          position: "left",
        });
      }

      // Add the route for the documentation
      addRoute({
        path: normalizeUrl([baseUrl, defaultOptions.route ?? "/api-docs"]),
        component: path.resolve(__dirname, "./ZudokuPage"),
        exact: true,
        ...content,
      });
    },
  };
}

export { ZudokuDocusaurus };
