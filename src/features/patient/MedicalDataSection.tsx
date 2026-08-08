"use client";

import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  SectionHeader,
  inputClass,
} from "@/components/ui";
import {
  DIAGNOSIS_CODES,
  ISSUER_CODES,
  TREATMENT_CODES,
} from "@/domain/medical/constants";
import type {
  MedicalStudy,
  MedicalStudyKind,
} from "@/domain/medical/types";
import { usePatient } from "@/features/patient/PatientProvider";
import { useI18n, type MessageKey } from "@/i18n";
import { hba1cFromScaled, hba1cToScaled } from "@/lib/format";
import { getMedicalFileUrl } from "@/lib/vault/medicalStudies";

const KINDS: MedicalStudyKind[] = [
  "lab_panel",
  "diagnosis_report",
  "prescription",
  "imaging",
  "other",
];

const KIND_KEY: Record<MedicalStudyKind, MessageKey> = {
  lab_panel: "vault.kindLabPanel",
  diagnosis_report: "vault.kindDiagnosisReport",
  prescription: "vault.kindPrescription",
  imaging: "vault.kindImaging",
  other: "vault.kindOther",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Clinical data lives right next to the opportunities: uploading is the fix for
 * "missing data" badges, so it must not be hidden behind navigation.
 */
export function MedicalDataSection({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  const { t, formatDate } = useI18n();
  const { medicalStudies, derived, isSaving, addMedicalStudy, removeMedicalStudy } =
    usePatient();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <SectionHeader
        title={t("patient.dataTitle")}
        subtitle={t("patient.dataSubtitle")}
        action={
          <Button variant={open ? "ghost" : "secondary"} onClick={() => setOpen(!open)}>
            {open ? t("common.hideForm") : t("vault.uploadCta")}
          </Button>
        }
      />

      {derived.missing.length > 0 && medicalStudies.length > 0 ? (
        <p className="mb-3 text-sm text-amber-200">
          {t("vault.witnessMissing", {
            fields: derived.missing.map((f) => t(fieldKey(f))).join(", "),
          })}
        </p>
      ) : null}

      {open ? (
        <UploadForm
          busy={isSaving}
          onCancel={() => setOpen(false)}
          onSubmit={async (draft) => {
            const ok = await addMedicalStudy(draft);
            if (ok) setOpen(false);
          }}
        />
      ) : null}

      {medicalStudies.length === 0 ? (
        !open ? (
          <EmptyState
            title={t("patient.dataEmpty")}
            body={t("patient.dataEmptyCta")}
            action={<Button onClick={() => setOpen(true)}>{t("vault.uploadCta")}</Button>}
          />
        ) : null
      ) : (
        <ul className="mt-4 space-y-2">
          {medicalStudies.map((study) => (
            <li
              key={study.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {study.title}
                </p>
                <p className="text-xs text-slate-500">
                  {t(KIND_KEY[study.kind])} · {study.issuerId} ·{" "}
                  {formatDate(study.issuedAt)}
                </p>
              </div>
              <StudyValues study={study} />
              {study.filePath ? (
                <button
                  type="button"
                  className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                  onClick={async () => {
                    const url = await getMedicalFileUrl(study.filePath!);
                    if (url) window.open(url, "_blank", "noopener");
                  }}
                >
                  {t("vault.fileOpen")}
                </button>
              ) : null}
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-rose-300"
                onClick={() => void removeMedicalStudy(study)}
              >
                {t("vault.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-slate-500">{t("vault.privacyNote")}</p>
    </Card>
  );
}

/** Maps a missing witness field onto the label the criteria UI already uses. */
function fieldKey(field: string): MessageKey {
  const map: Record<string, MessageKey> = {
    age: "matches.minAge",
    diagnosis: "matches.diagnosis",
    hba1cScaled: "matches.minHba1c",
    treatment: "matches.treatment",
    treatmentMonths: "matches.minTreatmentMonths",
  };
  return map[field] ?? "common.details";
}

function StudyValues({ study }: { study: MedicalStudy }) {
  const values = [
    study.diagnosisCode,
    study.hba1cScaled !== null ? `${hba1cFromScaled(study.hba1cScaled)}%` : null,
    study.treatmentCode,
  ].filter(Boolean);

  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={String(value)}>{value}</Badge>
      ))}
    </div>
  );
}

function UploadForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: Parameters<ReturnType<typeof usePatient>["addMedicalStudy"]>[0]) => void;
}) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const num = (name: string): number | null => {
      const raw = form.get(name);
      if (typeof raw !== "string" || raw.trim() === "") return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const str = (name: string): string =>
      typeof form.get(name) === "string" ? String(form.get(name)).trim() : "";

    const hba1c = num("hba1c");

    onSubmit({
      kind: str("kind") as MedicalStudyKind,
      title: str("title"),
      issuerId: str("issuer"),
      issuedAt: str("issuedAt"),
      age: num("age"),
      diagnosisCode: str("diagnosis") || null,
      hba1cScaled: hba1c === null ? null : hba1cToScaled(hba1c),
      treatmentCode: str("treatment") || null,
      treatmentMonths: num("treatmentMonths"),
      file,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("vault.kind")}>
          <select name="kind" defaultValue="lab_panel" className={inputClass}>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(KIND_KEY[kind])}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("vault.studyTitle")}>
          <input
            name="title"
            required
            placeholder={t("vault.studyTitlePlaceholder")}
            className={inputClass}
          />
        </Field>
        <Field label={t("vault.issuer")}>
          <select name="issuer" defaultValue={ISSUER_CODES[0]} className={inputClass}>
            {ISSUER_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("vault.issuedAt")}>
          <input
            type="date"
            name="issuedAt"
            required
            defaultValue={today()}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("vault.age")} hint={t("common.optional")}>
          <input type="number" name="age" min={0} max={150} className={inputClass} />
        </Field>
        <Field label={t("vault.diagnosis")} hint={t("common.optional")}>
          <select name="diagnosis" defaultValue="" className={inputClass}>
            <option value="">{t("common.none")}</option>
            {DIAGNOSIS_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("vault.hba1c")} hint={t("common.optional")}>
          <input
            type="number"
            name="hba1c"
            step="0.1"
            min={0}
            max={30}
            className={inputClass}
          />
        </Field>
        <Field label={t("vault.treatment")} hint={t("common.optional")}>
          <select name="treatment" defaultValue="" className={inputClass}>
            <option value="">{t("common.none")}</option>
            {TREATMENT_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("vault.treatmentMonths")} hint={t("common.optional")}>
          <input
            type="number"
            name="treatmentMonths"
            min={0}
            max={600}
            className={inputClass}
          />
        </Field>
        <Field label={t("vault.file")} hint={t("vault.fileHint")}>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? t("vault.uploading") : t("vault.uploadCta")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
