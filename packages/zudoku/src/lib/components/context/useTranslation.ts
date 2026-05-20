import { useCallback } from "react";
import { translate } from "../../core/i18n.js";
import { useZudoku } from "./ZudokuContext.js";

/**
 * Returns a `t(key, values?)` function plus the active locale.
 *
 * Keys are flat strings (e.g. "openapi.downloadSchema"). Plugins ship their
 * own defaults via the `getTranslations()` plugin hook; users override any key
 * via `i18n.messages` in their Zudoku config.
 */
export const useTranslation = () => {
  const { i18n } = useZudoku();

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      translate(i18n, key, values),
    [i18n],
  );

  return { t, locale: i18n.locale, defaultLocale: i18n.defaultLocale };
};
