/** Diagnosis codes used by Study #001 (synthetic T2D MVP). */
export type DiagnosisCode = "TYPE_2_DIABETES";

/** Treatment codes used by Study #001. */
export type TreatmentCode = "METFORMIN";

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
