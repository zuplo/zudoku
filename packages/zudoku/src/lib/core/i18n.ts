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
  // Reserved core keys go here. Most strings live in their plugin's catalog.
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
