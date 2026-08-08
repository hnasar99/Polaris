import { en } from "@/i18n/messages/en";
import { es, type Messages } from "@/i18n/messages/es";

/**
 * Adding a locale is: write one dictionary file typed as `Messages`, then add
 * it to the three maps below. Nothing else in the app needs to change.
 */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Spanish is the product's primary language and the fallback for everything. */
export const DEFAULT_LOCALE: Locale = "es";

export const DICTIONARIES: Record<Locale, Messages> = { es, en };

/** Short label for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = { es: "ES", en: "EN" };

/** Full name, used for the switcher's accessible label. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

/** BCP-47 tag for Intl formatting and the <html lang> attribute. */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
