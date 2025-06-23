import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const deCommon = require(
  new URL("../../de/common.json", import.meta.url).pathname,
);
const enCommon = require(
  new URL("../../en/common.json", import.meta.url).pathname,
);
const esCommon = require(
  new URL("../../es/common.json", import.meta.url).pathname,
);

void i18n.use(initReactI18next).init({
  fallbackLng: "en",
  lng: "en",
  resources: {
    en: { common: enCommon },
    de: { common: deCommon },
    es: { common: esCommon },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
