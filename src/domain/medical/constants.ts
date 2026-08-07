/** Simulated trusted medical issuer for the hackathon MVP. */
export const ISSUER_HOSPITAL_DEMO = "HOSPITAL_DEMO" as const;

export const DIAGNOSIS_TYPE_2_DIABETES = "TYPE_2_DIABETES" as const;
export const TREATMENT_METFORMIN = "METFORMIN" as const;

/**
 * Seed synthetic patient used when Supabase is unavailable or for tests.
 * All values are fictional — no real medical data.
 */
export const SYNTHETIC_PATIENT_ID = "11111111-1111-4111-8111-111111111111";
export const SYNTHETIC_MEDICAL_RECORD_ID =
  "22222222-2222-4222-8222-222222222222";
export const SYNTHETIC_PATIENT_ALIAS = "anon_84F2";

export const SYNTHETIC_PATIENT_WITNESS = {
  patientId: SYNTHETIC_PATIENT_ID,
  age: 47,
  diagnosis: DIAGNOSIS_TYPE_2_DIABETES,
  hba1cScaled: 81,
  treatment: TREATMENT_METFORMIN,
  treatmentMonths: 18,
  issuerId: ISSUER_HOSPITAL_DEMO,
} as const;
