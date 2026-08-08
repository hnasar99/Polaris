"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { MessageKey } from "@/i18n/keys";
import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  LOCALE_TAGS,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { es } from "@/i18n/messages/es";
import { createLocalStore, hydratedStore } from "@/lib/browserStore";

const localeStore = createLocalStore("polaris:locale");

export type TranslateParams = Record<string, string | number>;

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** True once the stored preference has been applied on the client. */
  hydrated: boolean;
  t: (key: MessageKey, params?: TranslateParams) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (
    value: string | Date,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function lookup(dictionary: unknown, key: string): string | undefined {
  let current: unknown = dictionary;
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  /**
   * The server cannot read localStorage, so it renders the default locale and
   * the client matches it through hydration. The stored preference lands on the
   * re-render React schedules once hydration is already committed — Spanish is
   * the fallback whenever nothing is stored.
   */
  const stored = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    hydratedStore.subscribe,
    hydratedStore.getSnapshot,
    hydratedStore.getServerSnapshot,
  );
  const locale: Locale = isLocale(stored) ? stored : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = LOCALE_TAGS[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => localeStore.set(next), []);

  const value = useMemo<I18nValue>(() => {
    const dictionary = DICTIONARIES[locale];
    const tag = LOCALE_TAGS[locale];

    return {
      locale,
      setLocale,
      hydrated,
      // Spanish is the canonical dictionary, so it is also the fallback.
      t: (key, params) =>
        interpolate(lookup(dictionary, key) ?? lookup(es, key) ?? key, params),
      formatNumber: (v, options) => new Intl.NumberFormat(tag, options).format(v),
      formatDate: (v, options) =>
        new Intl.DateTimeFormat(tag, options ?? { dateStyle: "medium" }).format(
          typeof v === "string" ? new Date(v) : v,
        ),
    };
  }, [hydrated, locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Shorthand for components that only need the translate function. */
export function useT(): I18nValue["t"] {
  return useI18n().t;
}
