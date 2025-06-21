import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export type I18nResources = Record<string, Record<string, string>>;

export function createI18n(resources: I18nResources, lng = "en") {
  const instance = i18n.createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
  return instance;
}
