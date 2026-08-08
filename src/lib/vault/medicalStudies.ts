/**
 * Patient vault storage for uploaded medical studies.
 *
 * Supabase when configured (table `medical_studies` + `medical-files` bucket),
 * otherwise a localStorage fallback so the app is usable without a backend.
 *
 * This vault is never queried to resolve eligibility — see the migration note.
 */

import type {
  MedicalStudy,
  MedicalStudyDraft,
} from "@/domain/medical/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DbMedicalStudy } from "@/lib/supabase/types";

const BUCKET = "medical-files";
const LOCAL_KEY = "polaris:vault:medical-studies";

export type VaultBackend = "supabase" | "local";

export function getVaultBackend(): VaultBackend {
  return getSupabaseClient() ? "supabase" : "local";
}

function mapRow(row: DbMedicalStudy): MedicalStudy {
  return {
    id: row.id,
    patientId: row.patient_id,
    kind: (row.kind as MedicalStudy["kind"]) ?? "other",
    title: row.title,
    issuerId: row.issuer_id,
    issuedAt: row.issued_at,
    age: row.age,
    diagnosisCode: row.diagnosis_code,
    hba1cScaled: row.hba1c_scaled,
    treatmentCode: row.treatment_code,
    treatmentMonths: row.treatment_months,
    filePath: row.file_path,
    fileName: row.file_name,
    verified: row.verified,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Local fallback
// ---------------------------------------------------------------------------

function readLocal(): MedicalStudy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MedicalStudy[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(studies: MedicalStudy[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(studies));
}

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listMedicalStudies(
  patientId: string,
): Promise<MedicalStudy[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return readLocal()
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  const { data, error } = await supabase
    .from("medical_studies")
    .select("*")
    .eq("patient_id", patientId)
    .order("issued_at", { ascending: false });

  if (error) throw error;
  return (data as DbMedicalStudy[]).map(mapRow);
}

export async function createMedicalStudy(
  patientId: string,
  draft: MedicalStudyDraft,
): Promise<MedicalStudy> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const study: MedicalStudy = {
      id: newId(),
      patientId,
      kind: draft.kind,
      title: draft.title,
      issuerId: draft.issuerId,
      issuedAt: draft.issuedAt,
      age: draft.age,
      diagnosisCode: draft.diagnosisCode,
      hba1cScaled: draft.hba1cScaled,
      treatmentCode: draft.treatmentCode,
      treatmentMonths: draft.treatmentMonths,
      // Files need object storage; the local fallback keeps only the name.
      filePath: null,
      fileName: draft.file?.name ?? null,
      verified: draft.issuerId !== "SELF_REPORTED",
      createdAt: new Date().toISOString(),
    };
    writeLocal([study, ...readLocal()]);
    return study;
  }

  let filePath: string | null = null;
  if (draft.file) {
    const safeName = draft.file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${patientId}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, draft.file, { upsert: false });
    if (uploadError) throw uploadError;
    filePath = path;
  }

  const { data, error } = await supabase
    .from("medical_studies")
    .insert({
      patient_id: patientId,
      kind: draft.kind,
      title: draft.title,
      issuer_id: draft.issuerId,
      issued_at: draft.issuedAt,
      age: draft.age,
      diagnosis_code: draft.diagnosisCode,
      hba1c_scaled: draft.hba1cScaled,
      treatment_code: draft.treatmentCode,
      treatment_months: draft.treatmentMonths,
      file_path: filePath,
      file_name: draft.file?.name ?? null,
      verified: draft.issuerId !== "SELF_REPORTED",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as DbMedicalStudy);
}

export async function deleteMedicalStudy(study: MedicalStudy): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    writeLocal(readLocal().filter((s) => s.id !== study.id));
    return;
  }

  if (study.filePath) {
    await supabase.storage.from(BUCKET).remove([study.filePath]);
  }
  const { error } = await supabase
    .from("medical_studies")
    .delete()
    .eq("id", study.id);
  if (error) throw error;
}

/** Signed URL for an attached file, valid for a short window. */
export async function getMedicalFileUrl(
  filePath: string,
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
