import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultMessages } from "./messages.js";

type MessageValues = Record<string, string | number>;

type TranslationFn = (key: string, values?: MessageValues) => string;

export type LocaleDefinition = {
  label: string;
  messages?: Record<string, string>;
};

type I18nContextValue = {
  messages: Record<string, string>;
  locale: string;
  locales: Record<string, LocaleDefinition> | undefined;
  setLocale: (locale: string) => void;
};

const I18nContext = createContext<I18nContextValue>({
  messages: {},
  locale: "en",
  locales: undefined,
  setLocale: () => {},
});

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

const LOCALE_STORAGE_KEY = "zudoku-locale";

const resolveMessages = (
  locale: string,
  locales: Record<string, LocaleDefinition> | undefined,
  fallbackMessages: Record<string, string>,
): Record<string, string> => {
  if (!locales) return fallbackMessages;

  const localeMessages = locales[locale]?.messages;
  if (!localeMessages) return { ...defaultMessages };

  return { ...defaultMessages, ...localeMessages };
};

export const I18nProvider = ({
  messages,
  locale: initialLocale,
  locales,
  children,
}: {
  messages: Record<string, string>;
  locale: string;
  locales?: Record<string, LocaleDefinition>;
  children: ReactNode;
}) => {
  const [locale, setLocaleState] = useState(() => {
    if (!locales) return initialLocale;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && stored in locales) return stored;
    }

    return initialLocale;
  });

  const resolvedMessages = useMemo(
    () => (locales ? resolveMessages(locale, locales, messages) : messages),
    [locale, locales, messages],
  );

  const setLocale = useCallback(
    (newLocale: string) => {
      if (locales && !(newLocale in locales)) return;
      setLocaleState(newLocale);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      }
    },
    [locales],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ messages: resolvedMessages, locale, locales, setLocale }),
    [resolvedMessages, locale, locales, setLocale],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
};

export const useTranslation = (): { t: TranslationFn } => {
  const { messages } = use(I18nContext);
  return useMemo(() => ({ t: createT(messages) }), [messages]);
};

export const useLocale = (): {
  locale: string;
  locales: Record<string, LocaleDefinition> | undefined;
  setLocale: (locale: string) => void;
} => {
  const { locale, locales, setLocale } = use(I18nContext);
  return { locale, locales, setLocale };
};
