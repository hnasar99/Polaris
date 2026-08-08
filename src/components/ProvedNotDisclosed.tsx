"use client";

import { Card } from "@/components/ui";
import { useI18n } from "@/i18n";

/** Side-by-side summary of what a proof reveals and what it never touches. */
export function ProvedNotDisclosed() {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-emerald-400/25 bg-emerald-400/5">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
          {t("privacy.provedTitle")}
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-emerald-50">
          {(["proved1", "proved2", "proved3", "proved4"] as const).map((key) => (
            <li key={key}>{t(`privacy.${key}`)}</li>
          ))}
        </ul>
      </Card>

      <Card tone="muted">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
          {t("privacy.notDisclosedTitle")}
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
          {(
            [
              "notDisclosed1",
              "notDisclosed2",
              "notDisclosed3",
              "notDisclosed4",
            ] as const
          ).map((key) => (
            <li key={key}>{t(`privacy.${key}`)}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
