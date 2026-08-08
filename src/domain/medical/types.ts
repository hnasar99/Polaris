/**
 * Diagnosis / treatment codes.
 *
 * Kept as plain strings because a laboratory can publish research for any code
 * in the catalog (see domain/medical/constants) and patients upload studies
 * issued elsewhere. Catalogs drive the pickers; the type stays open.
 */
export type DiagnosisCode = string;
export type TreatmentCode = string;

/**
 * Private medical witness values.
 * These stay client-side and must never appear in Midnight response types
 * or public ledger projections.
 *
 * HbA1c is stored as a scaled integer: 81 === 8.1%.
 */
export interface PrivateMedicalWitness {
  patientId: string;
  age: number;
  diagnosis: DiagnosisCode;
  hba1cScaled: number;
  treatment: TreatmentCode;
  treatmentMonths: number;
  issuerId: string;
}

/** Synthetic vault record shape used by the patient client. */
export interface MedicalRecord {
  id: string;
  patientId: string;
  age: number;
  diagnosisCode: DiagnosisCode;
  hba1cScaled: number;
  treatmentCode: TreatmentCode;
  treatmentMonths: number;
  issuerId: string;
  verified: boolean;
  createdAt: string;
}

export interface PatientProfile {
  id: string;
  walletAddress: string | null;
  displayAlias: string;
  createdAt: string;
}

/** Kind of medical study a patient uploads to their private vault. */
export type MedicalStudyKind =
  | "lab_panel"
  | "diagnosis_report"
  | "prescription"
  | "imaging"
  | "other";

/**
 * A medical study uploaded by the patient (lab result, report, prescription).
 *
 * Lives in the patient's private vault (Supabase + Storage), never on-chain.
 * Its structured fields feed the local eligibility matcher and the ZK witness.
 */
export interface MedicalStudy {
  id: string;
  patientId: string;
  kind: MedicalStudyKind;
  title: string;
  issuerId: string;
  /** ISO date the study was issued by the provider. */
  issuedAt: string;
  age: number | null;
  diagnosisCode: DiagnosisCode | null;
  hba1cScaled: number | null;
  treatmentCode: TreatmentCode | null;
  treatmentMonths: number | null;
  /** Supabase Storage object path, when a file was attached. */
  filePath: string | null;
  fileName: string | null;
  verified: boolean;
  createdAt: string;
}

/** Draft shape submitted by the upload form. */
export type MedicalStudyDraft = Omit<
  MedicalStudy,
  "id" | "patientId" | "createdAt" | "verified" | "filePath" | "fileName"
> & {
  file?: File | null;
};
