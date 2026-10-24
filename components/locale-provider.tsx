"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { applyLocale, detectLocale, dictionaries, type Dictionary, type Locale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: dictionaries.en,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useLayoutEffect(() => {
    const next = detectLocale();
    applyLocale(next, false);
    setLocaleState(next);
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: next => {
      applyLocale(next);
      setLocaleState(next);
    },
    t: dictionaries[locale],
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  return useContext(LocaleContext);
}
