import type { TranslationCatalog } from "../../core/i18n.js";

/**
 * Default (English) translations for the OpenAPI plugin. Add new keys here and
 * reference them via `useTranslation()` in components.
 */
export const openapiTranslations: TranslationCatalog = {
  en: {
    "openapi.downloadSchema": "Download schema",
    "openapi.openInNewTab": "Open in new tab",
    "openapi.copyToClipboard": "Copy to clipboard",
  },
};
