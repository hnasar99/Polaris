"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Field, SectionHeader, Spinner, inputClass } from "@/components/ui";
import { DIAGNOSIS_CODES, TREATMENT_CODES } from "@/domain/medical/constants";
import { useChain } from "@/features/chain/ChainProvider";
import { useI18n } from "@/i18n";
import { hba1cToScaled } from "@/lib/format";

function suggestCode(): string {
  return `STUDY_${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

/**
 * Publishing is the primary path for a laboratory and moves no money: the
 * research is paid off-platform and participants are paid from the vault.
 */
export function LaunchStudyForm({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n();
  const { launchStudy, busyKey, studies } = useChain();
  const [code] = useState(suggestCode);
  const [error, setError] = useState<string | null>(null);
  const busy = busyKey === "launch";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const str = (name: string) => String(form.get(name) ?? "").trim();
    const num = (name: string) => Number(form.get(name) ?? 0) || 0;

    const externalStudyId = str("code").toUpperCase();
    if (studies.some((s) => s.externalStudyId === externalStudyId)) {
      setError(t("lab.codeTaken"));
      return;
    }

    await launchStudy({
      externalStudyId,
      title: str("title"),
      description: str("description"),
      researcherAlias: str("alias"),
      criteria: {
        minAge: num("minAge"),
        requiredDiagnosis: str("diagnosis"),
        minHba1cScaled: hba1cToScaled(num("hba1c")),
        requiredTreatment: str("treatment"),
        minTreatmentMonths: num("months"),
      },
      rewardAmount: num("reward"),
    });
    onDone?.();
  }

  return (
    <Card>
      <SectionHeader
        title={t("lab.createTitle")}
        subtitle={t("lab.launchIntro")}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("lab.studyTitle")}>
            <input name="title" required className={inputClass} />
          </Field>
          <Field label={t("lab.researcherAlias")}>
            <input name="alias" required className={inputClass} />
          </Field>
        </div>

        <Field label={t("lab.description")}>
          <textarea name="description" rows={3} className={inputClass} />
        </Field>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("lab.criteriaTitle")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("lab.minAge")}>
              <input
                type="number"
                name="minAge"
                min={0}
                max={150}
                defaultValue={18}
                className={inputClass}
              />
            </Field>
            <Field label={t("lab.requiredDiagnosis")}>
              <select name="diagnosis" defaultValue={DIAGNOSIS_CODES[0]} className={inputClass}>
                {DIAGNOSIS_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("lab.minHba1c")}>
              <input
                type="number"
                name="hba1c"
                step="0.1"
                min={0}
                max={30}
                defaultValue={7}
                className={inputClass}
              />
            </Field>
            <Field label={t("lab.requiredTreatment")}>
              <select name="treatment" defaultValue={TREATMENT_CODES[0]} className={inputClass}>
                {TREATMENT_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("lab.minTreatmentMonths")}>
              <input
                type="number"
                name="months"
                min={0}
                max={600}
                defaultValue={6}
                className={inputClass}
              />
            </Field>
            <Field label={t("lab.reward")} hint={t("lab.payoutSource")}>
              <input
                type="number"
                name="reward"
                min={1}
                defaultValue={50}
                required
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <Field label={t("lab.studyCode")} hint={t("lab.studyCodeHint")}>
          <input name="code" defaultValue={code} required className={inputClass} />
        </Field>

        <p className="text-xs text-slate-500">{t("lab.paidOffline")}</p>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <Button type="submit" disabled={busy} full>
          {busy ? (
            <>
              <Spinner /> {t("lab.launching")}
            </>
          ) : (
            t("lab.launch")
          )}
        </Button>
      </form>
    </Card>
  );
}
