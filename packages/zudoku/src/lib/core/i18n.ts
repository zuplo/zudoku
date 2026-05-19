/**
 * Lightweight i18n core for Zudoku.
 *
 * - Translation keys are flat strings (e.g. "openapi.downloadSchema").
 * - Placeholders use the ICU MessageFormat `{name}` syntax for a single value.
 *   Pluralization / formatting helpers can be added later by swapping the
 *   `interpolate()` implementation for `@formatjs/intl-messageformat` without
 *   changing call sites.
 * - Default English messages live alongside the code that uses them. Plugins
 *   contribute their own keys via the `getTranslations()` plugin hook so the
 *   catalog stays modular. End users override any key via `i18n.messages` in
 *   their Zudoku config.
 */

export type TranslationMessages = Record<string, string>;

export type TranslationCatalog = Record<string, TranslationMessages>;

export type I18nOptions = {
  /** Locale to render in. Falls back to `defaultLocale` when missing. */
  locale?: string;
  /** Locale used when a key is missing from the active locale. Defaults to "en". */
  defaultLocale?: string;
  /** Per-locale message dictionaries. Each entry merges over plugin + core defaults. */
  messages?: TranslationCatalog;
};

export type ResolvedI18n = {
  locale: string;
  defaultLocale: string;
  /** Merged catalog: core defaults < plugin defaults < user overrides. */
  catalog: TranslationCatalog;
};

/**
 * Default (English) catalog shipped with the core. Plugin defaults are merged
 * in by the runtime, so plugin authors don't have to touch this file.
 */
export const defaultMessages: TranslationMessages = {
  // Navigation / shell
  "nav.title": "Navigation",
  "nav.openMenu": "Open navigation menu",

  // Developer hint
  "developerHint.title": "Developer hint",
  "developerHint.devOnly": "Only shown in development mode.",

  // Mermaid
  "mermaid.error": "Mermaid Error",

  // Not found
  "notFound.title": "Page not found",
  "notFound.body":
    "It seems that the page you are looking for does not exist or may have been moved. Please check the URL for any typos or use the navigation menu to find the correct page.",
  "notFound.goHome": "Go back home",
  "notFound.developerHint":
    "Start by adding a file at `{root}/{path}.mdx` and add some content to make this error go away. By default `DOCUMENT_ROOT` is the `pages` directory.",

  // Errors / status pages
  "error.default.title": "An error occurred",
  "error.default.message":
    "Something went wrong while processing your request.",
  "error.400.title": "Bad Request",
  "error.400.message":
    "The request could not be understood by the server due to malformed syntax.",
  "error.403.title": "Forbidden",
  "error.403.message": "You don't have permission to access this resource.",
  "error.404.title": "Not Found",
  "error.404.message": "The requested resource could not be found.",
  "error.405.title": "Method Not Allowed",
  "error.405.message":
    "The request method is not supported for the requested resource.",
  "error.414.title": "Request URI Too Large",
  "error.414.message": "The request URI is too large.",
  "error.416.title": "Range Not Satisfiable",
  "error.416.message": "The server cannot satisfy the request range.",
  "error.500.title": "Internal Server Error",
  "error.500.message":
    "An unexpected error occurred while processing your request.",
  "error.501.title": "Not Implemented",
  "error.501.message":
    "The server does not support the functionality required to fulfill the request.",
  "error.502.title": "Bad Gateway",
  "error.502.message":
    "The server received an invalid response from the upstream server.",
  "error.503.title": "Service Unavailable",
  "error.503.message":
    "The server is temporarily unable to handle the request.",
  "error.504.title": "Gateway Timeout",
  "error.504.message":
    "The server did not receive a timely response from the upstream server.",

  // AI assistants
  "ai.useInClaude": "Use in Claude",
  "ai.useInChatGPT": "Use in ChatGPT",
  "ai.prompt.api": "Help me understand this API: {pageUrl}",
  "ai.prompt.docs": "Help me understand this documentation page: {pageUrl}",
};

const PLACEHOLDER = /\{(\w+)\}/g;

export const interpolate = (
  template: string,
  values?: Record<string, string | number>,
): string => {
  if (!values) return template;
  return template.replace(PLACEHOLDER, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
};

export const mergeCatalogs = (
  ...catalogs: Array<TranslationCatalog | undefined>
): TranslationCatalog => {
  const merged: TranslationCatalog = {};
  for (const catalog of catalogs) {
    if (!catalog) continue;
    for (const [locale, messages] of Object.entries(catalog)) {
      merged[locale] = { ...merged[locale], ...messages };
    }
  }
  return merged;
};

export const resolveI18n = (
  options: I18nOptions | undefined,
  pluginCatalogs: TranslationCatalog[],
): ResolvedI18n => {
  const defaultLocale = options?.defaultLocale ?? "en";
  const locale = options?.locale ?? defaultLocale;

  const catalog = mergeCatalogs(
    { [defaultLocale]: defaultMessages },
    ...pluginCatalogs,
    options?.messages,
  );

  return { locale, defaultLocale, catalog };
};

export const translate = (
  i18n: ResolvedI18n,
  key: string,
  values?: Record<string, string | number>,
): string => {
  const active = i18n.catalog[i18n.locale]?.[key];
  const fallback = i18n.catalog[i18n.defaultLocale]?.[key];
  // If a key has no translation at all we return the key itself so missing
  // strings are obvious during development.
  const template = active ?? fallback ?? key;
  return interpolate(template, values);
};
