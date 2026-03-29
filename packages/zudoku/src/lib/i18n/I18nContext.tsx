import { createContext, type ReactNode, use, useMemo } from "react";

type MessageValues = Record<string, string | number>;

type TranslationFn = (key: string, values?: MessageValues) => string;

const I18nContext = createContext<Record<string, string>>({});

const interpolate = (template: string, values?: MessageValues): string => {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in values) {
      return String(values[key]);
    }
    return match;
  });
};

const createT = (messages: Record<string, string>): TranslationFn => {
  return (key: string, values?: MessageValues): string => {
    const template = messages[key];

    if (template === undefined) {
      if (process.env.NODE_ENV !== "production") {
        // biome-ignore lint/suspicious/noConsole: Development warning for missing i18n keys
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }
      return interpolate(key, values);
    }

    return interpolate(template, values);
  };
};

export const I18nProvider = ({
  messages,
  children,
}: {
  messages: Record<string, string>;
  children: ReactNode;
}) => {
  return <I18nContext value={messages}>{children}</I18nContext>;
};

export const useTranslation = (): { t: TranslationFn } => {
  const messages = use(I18nContext);
  return useMemo(() => ({ t: createT(messages) }), [messages]);
};
