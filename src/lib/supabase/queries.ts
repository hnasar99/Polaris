import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_MEDICAL_RECORD_ID,
  SYNTHETIC_PATIENT_ALIAS,
  SYNTHETIC_PATIENT_ID,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import type {
  DiagnosisCode,
  MedicalRecord,
  PatientProfile,
  TreatmentCode,
} from "@/domain/medical/types";
import { STUDY_001 } from "@/domain/study/study001";
import type { Study } from "@/domain/study/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  DbMedicalRecord,
  DbPatientProfile,
  DbStudy,
} from "@/lib/supabase/types";

function fallbackPatient(): PatientProfile {
  return {
    id: SYNTHETIC_PATIENT_ID,
    walletAddress: null,
    displayAlias: SYNTHETIC_PATIENT_ALIAS,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function fallbackMedicalRecord(): MedicalRecord {
  return {
    id: SYNTHETIC_MEDICAL_RECORD_ID,
    patientId: SYNTHETIC_PATIENT_ID,
    age: 47,
    diagnosisCode: DIAGNOSIS_TYPE_2_DIABETES,
    hba1cScaled: 81,
    treatmentCode: TREATMENT_METFORMIN,
    treatmentMonths: 18,
    issuerId: ISSUER_HOSPITAL_DEMO,
    verified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function mapPatient(row: DbPatientProfile): PatientProfile {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    displayAlias: row.display_alias,
    createdAt: row.created_at,
  };
}

function mapMedicalRecord(row: DbMedicalRecord): MedicalRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    age: row.age,
    diagnosisCode: row.diagnosis_code as DiagnosisCode,
    hba1cScaled: row.hba1c_scaled,
    treatmentCode: row.treatment_code as TreatmentCode,
    treatmentMonths: row.treatment_months,
    issuerId: row.issuer_id,
    verified: row.verified,
    createdAt: row.created_at,
  };
}

function mapStudy(row: DbStudy): Study {
  return {
    id: row.id,
    externalStudyId: row.external_study_id,
    title: row.title,
    description: row.description,
    researcherAlias: row.researcher_alias,
    criteria: {
      minAge: row.min_age,
      requiredDiagnosis: row.required_diagnosis as DiagnosisCode,
      minHba1cScaled: row.min_hba1c_scaled,
      requiredTreatment: row.required_treatment as TreatmentCode,
      minTreatmentMonths: row.min_treatment_months,
    },
    rewardAmount: row.reward_amount,
    rewardSymbol: row.reward_symbol,
    active: row.active,
    createdAt: row.created_at,
  };
}

/**
 * Load the current demo patient's profile.
 * Falls back to in-repo synthetic constants when Supabase is not configured.
 */
export async function loadPatientProfile(): Promise<PatientProfile> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackPatient();
  }

  const { data, error } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("id", SYNTHETIC_PATIENT_ID)
    .maybeSingle();

  if (error || !data) {
    return fallbackPatient();
  }
  return mapPatient(data as DbPatientProfile);
}

/**
 * Load synthetic medical record for the patient client (private local input).
 * IMPORTANT: Do not use this table for cohort SQL filtering / eligibility.
 */
export async function loadMedicalRecord(
  patientId: string = SYNTHETIC_PATIENT_ID,
): Promise<MedicalRecord> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackMedicalRecord();
  }

  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error || !data) {
    return fallbackMedicalRecord();
  }
  return mapMedicalRecord(data as DbMedicalRecord);
}

/** Load Study #001 metadata for UI listing (criteria display only). */
export async function loadStudy001(): Promise<Study> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return STUDY_001;
  }

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("external_study_id", "STUDY_001")
    .maybeSingle();

  if (error || !data) {
    return STUDY_001;
  }
  return mapStudy(data as DbStudy);
}

export async function loadActiveStudies(): Promise<Study[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [STUDY_001];
  }

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return [STUDY_001];
  }
  return (data as DbStudy[]).map(mapStudy);
}
