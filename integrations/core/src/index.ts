/**
 * Zudoku SDK Core HTML Rendering Module
 *
 * This module provides utilities for generating HTML documents that render
 * Zudoku API documentation from OpenAPI specifications.
 *
 * @packageDocumentation
 */

/**
 * Logo configuration for the API reference page
 */
export type ZudokuLogoConfiguration = {
  /** Logo source URL, or separate URLs for light and dark themes */
  src: string | { light: string; dark: string };
  /** Optional width for the logo (CSS value, e.g., "120px") */
  width?: string;
};

/**
 * OpenAPI specification configuration
 */
export type ZudokuSpecConfiguration = {
  /** URL to fetch the OpenAPI spec from */
  url?: string;
  /** Inline OpenAPI spec content (JSON string or object) */
  content?: string | object;
};

/**
 * Page metadata configuration
 */
export type ZudokuMetadataConfiguration = {
  /** Page title for the document head */
  title?: string;
  /** Meta description for SEO */
  description?: string;
};

/**
 * Configuration for Zudoku API Reference rendering
 */
export type ZudokuApiReferenceConfiguration = {
  /** OpenAPI specification source */
  spec?: ZudokuSpecConfiguration;
  /** Page title (used as fallback if metadata.title is not set) */
  pageTitle?: string;
  /** Favicon URL */
  favicon?: string;
  /** Logo configuration */
  logo?: ZudokuLogoConfiguration;
  /** CDN base URL for Zudoku assets (defaults to jsdelivr) */
  cdn?: string;
  /** Custom CSS to inject into the page */
  customCss?: string;
  /** Page metadata for document head */
  metadata?: ZudokuMetadataConfiguration;
  /**
   * Internal integration identifier for analytics
   * @internal
   */
  _integration?: string;
};

/**
 * CDN URLs for Zudoku assets
 */
export type ZudokuCdnUrls = {
  /** URL to the main JavaScript module */
  script: string;
  /** URL to the stylesheet */
  style: string;
};

/**
 * Default CDN base URL for Zudoku assets
 */
const DEFAULT_CDN_BASE = "https://cdn.jsdelivr.net/npm/zudoku";

/**
 * Default version tag for CDN assets
 */
const DEFAULT_VERSION = "latest";

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGURATION: Required<
  Pick<ZudokuApiReferenceConfiguration, "pageTitle">
> &
  Partial<ZudokuApiReferenceConfiguration> = {
  pageTitle: "API Documentation",
};

/**
 * Returns the CDN URLs for Zudoku script and styles
 *
 * @param version - Optional version string (defaults to "latest")
 * @returns Object containing script and style URLs
 *
 * @example
 * ```typescript
 * const urls = getCdnUrl();
 * // { script: "https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/main.js", style: "..." }
 *
 * const urls = getCdnUrl("1.0.0");
 * // { script: "https://cdn.jsdelivr.net/npm/zudoku@1.0.0/standalone/main.js", style: "..." }
 * ```
 */
export function getCdnUrl(version?: string): ZudokuCdnUrls {
  const versionTag = version ?? DEFAULT_VERSION;
  const baseUrl = `${DEFAULT_CDN_BASE}@${versionTag}/standalone`;

  return {
    script: `${baseUrl}/main.js`,
    style: `${baseUrl}/style.css`,
  };
}

/**
 * HTML special characters mapping for XSS prevention
 */
const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
function escapeHtml(text: string): string {
  if (!text) {
    return "";
  }
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * Escapes content for safe insertion inside a script tag.
 * Prevents breaking out of the script context via </script>.
 *
 * @param content - The content to escape
 * @returns The escaped content safe for script tag insertion
 */
function escapeScriptContent(content: string): string {
  if (!content) {
    return "";
  }
  // Replace </script with <\/script to prevent breaking out of script tags
  // Also handle <!-- to prevent HTML comment injection
  return content
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

/**
 * Escapes CSS content for safe insertion inside a style tag.
 * Prevents breaking out of the style context via </style>.
 *
 * @param css - The CSS content to escape
 * @returns The escaped CSS safe for style tag insertion
 */
function escapeStyleContent(css: string): string {
  if (!css) {
    return "";
  }
  // Replace </style with an escaped version to prevent breaking out
  return css.replace(/<\/style/gi, "<\\/style");
}

/**
 * Parses spec content from string to object if needed
 *
 * @param content - The spec content (string or object)
 * @returns The parsed spec object
 * @throws Error if the string content is not valid JSON
 */
function parseSpecContent(content: string | object): object {
  if (typeof content !== "string") {
    return content;
  }

  try {
    return JSON.parse(content) as object;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown parsing error";
    throw new Error(
      `Failed to parse OpenAPI spec content as JSON: ${message}. ` +
        `Ensure the spec content is valid JSON or pass an object instead.`,
    );
  }
}

/**
 * Generates a complete HTML5 document for rendering Zudoku API documentation
 *
 * @param configuration - The Zudoku configuration options
 * @param customTheme - Optional custom theme CSS string
 * @returns A complete HTML5 document string
 * @throws Error if spec.content is a string that cannot be parsed as JSON
 *
 * @example
 * ```typescript
 * // Using a URL to load the spec
 * const html = getHtmlDocument({
 *   spec: { url: "https://example.com/openapi.json" },
 *   pageTitle: "My API Docs",
 * });
 *
 * // Using inline spec content
 * const html = getHtmlDocument({
 *   spec: { content: { openapi: "3.0.0", info: { title: "API", version: "1.0" } } },
 *   metadata: { title: "My API", description: "API documentation" },
 * });
 * ```
 */
export function getHtmlDocument(
  configuration: ZudokuApiReferenceConfiguration,
  customTheme?: string,
): string {
  const {
    spec,
    pageTitle,
    favicon,
    logo,
    cdn,
    customCss,
    metadata,
    _integration,
  } = configuration;

  // Determine CDN URLs
  const cdnUrls = cdn
    ? { script: `${cdn}/main.js`, style: `${cdn}/style.css` }
    : getCdnUrl();

  // Build the page title with proper fallback for empty strings
  const title =
    (metadata?.title?.trim() || pageTitle?.trim()) ??
    DEFAULT_CONFIGURATION.pageTitle;

  // Build head elements
  const headElements: string[] = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${escapeHtml(title)}</title>`,
    `<link rel="stylesheet" href="${escapeHtml(cdnUrls.style)}">`,
  ];

  // Add description meta tag if provided and not empty
  const description = metadata?.description?.trim();
  if (description) {
    headElements.push(
      `<meta name="description" content="${escapeHtml(description)}">`,
    );
  }

  // Add favicon if provided and not empty
  const faviconUrl = favicon?.trim();
  if (faviconUrl) {
    headElements.push(`<link rel="icon" href="${escapeHtml(faviconUrl)}">`);
  }

  // Add custom theme CSS (escaped to prevent style tag injection)
  if (customTheme?.trim()) {
    headElements.push(`<style>${escapeStyleContent(customTheme)}</style>`);
  }

  // Add custom CSS (escaped to prevent style tag injection)
  if (customCss?.trim()) {
    headElements.push(`<style>${escapeStyleContent(customCss)}</style>`);
  }

  // Build the data div attributes
  const dataAttributes: string[] = [];

  const specUrl = spec?.url?.trim();
  if (specUrl) {
    dataAttributes.push(`data-api-url="${escapeHtml(specUrl)}"`);
  }

  if (_integration) {
    dataAttributes.push(`data-integration="${escapeHtml(_integration)}"`);
  }

  // Build body elements
  const bodyElements: string[] = [];

  // If we have inline spec content or logo configuration, embed as script
  const hasInlineConfig = spec?.content !== undefined || logo !== undefined;

  if (hasInlineConfig) {
    const configObject: Record<string, unknown> = {};

    if (spec?.content !== undefined) {
      configObject.spec = parseSpecContent(spec.content);
    } else if (specUrl) {
      configObject.specUrl = specUrl;
    }

    if (logo) {
      configObject.logo = logo;
    }

    if (_integration) {
      configObject._integration = _integration;
    }

    // Escape the JSON to prevent script tag injection
    const jsonConfig = escapeScriptContent(JSON.stringify(configObject));
    bodyElements.push(
      `<script id="zudoku-config" type="application/json">${jsonConfig}</script>`,
    );
    bodyElements.push(`<div id="zudoku-root"></div>`);
  } else {
    // Use data attributes for simple URL-based configuration
    const attributeString =
      dataAttributes.length > 0 ? ` ${dataAttributes.join(" ")}` : "";
    bodyElements.push(`<div id="zudoku-root"${attributeString}></div>`);
  }

  // Add the main script
  bodyElements.push(
    `<script type="module" src="${escapeHtml(cdnUrls.script)}"></script>`,
  );

  // Assemble the HTML5 document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${headElements.join("\n  ")}
</head>
<body>
  ${bodyElements.join("\n  ")}
</body>
</html>`;
}
