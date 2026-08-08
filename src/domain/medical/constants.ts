/** Simulated trusted medical issuer for the hackathon MVP. */
export const ISSUER_HOSPITAL_DEMO = "HOSPITAL_DEMO" as const;

export const DIAGNOSIS_TYPE_2_DIABETES = "TYPE_2_DIABETES" as const;
export const TREATMENT_METFORMIN = "METFORMIN" as const;

/**
 * Catalog used by the laboratory criteria form and the patient upload form.
 * Both sides must pick from the same list so codes hash to the same Bytes<32>.
 */
export const DIAGNOSIS_CODES = [
  "TYPE_2_DIABETES",
  "TYPE_1_DIABETES",
  "HYPERTENSION",
  "HYPERLIPIDEMIA",
  "CHRONIC_KIDNEY_DISEASE",
  "ASTHMA",
] as const;

export const TREATMENT_CODES = [
  "METFORMIN",
  "INSULIN_GLARGINE",
  "GLP1_AGONIST",
  "SGLT2_INHIBITOR",
  "ACE_INHIBITOR",
  "STATIN",
  "NONE",
] as const;

export const ISSUER_CODES = [
  "HOSPITAL_DEMO",
  "LAB_CENTRAL",
  "CLINICA_NORTE",
  "SELF_REPORTED",
] as const;

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
