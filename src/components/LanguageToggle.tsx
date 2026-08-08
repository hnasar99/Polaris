"use client";

import { cx } from "@/components/ui";
import { LOCALES, LOCALE_LABELS, LOCALE_NAMES, useI18n } from "@/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5"
      role="group"
      aria-label={t("common.language")}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          aria-label={LOCALE_NAMES[code]}
          title={LOCALE_NAMES[code]}
          className={cx(
            "rounded-md px-2 py-1 text-xs font-semibold uppercase transition",
            locale === code
              ? "bg-cyan-400/15 text-cyan-200"
              : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
