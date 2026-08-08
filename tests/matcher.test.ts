import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_PATIENT_ID,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import type { PrivateMedicalWitness } from "@/domain/medical/types";
import { deriveWitness } from "@/domain/medical/witness";
import type { MedicalStudy } from "@/domain/medical/types";
import { STUDY_001 } from "@/domain/study/study001";
import { evaluateLocalMatch } from "@/features/matching/matcher";

const QUALIFIES: PrivateMedicalWitness = {
  patientId: SYNTHETIC_PATIENT_ID,
  age: 47,
  diagnosis: DIAGNOSIS_TYPE_2_DIABETES,
  hba1cScaled: 81,
  treatment: TREATMENT_METFORMIN,
  treatmentMonths: 18,
  issuerId: ISSUER_HOSPITAL_DEMO,
};

function medicalStudy(overrides: Partial<MedicalStudy>): MedicalStudy {
  return {
    id: "s1",
    patientId: SYNTHETIC_PATIENT_ID,
    kind: "lab_panel",
    title: "panel",
    issuerId: ISSUER_HOSPITAL_DEMO,
    issuedAt: "2026-01-01",
    age: null,
    diagnosisCode: null,
    hba1cScaled: null,
    treatmentCode: null,
    treatmentMonths: null,
    filePath: null,
    fileName: null,
    verified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("evaluateLocalMatch", () => {
  it("matches when every criterion holds", () => {
    const result = evaluateLocalMatch(QUALIFIES, STUDY_001.criteria);
    expect(result).toEqual({ matches: true, failed: [], undetermined: [] });
  });

  it("reports the criteria that fail without leaking values", () => {
    const result = evaluateLocalMatch(
      { ...QUALIFIES, age: 30, treatmentMonths: 2 },
      STUDY_001.criteria,
    );
    expect(result.matches).toBe(false);
    expect(result.failed).toEqual(["minAge", "minTreatmentMonths"]);
    expect(result.undetermined).toEqual([]);
  });

  it("marks criteria as undetermined instead of failed when data is missing", () => {
    const result = evaluateLocalMatch(QUALIFIES, STUDY_001.criteria, [
      "hba1cScaled",
    ]);
    expect(result.matches).toBe(false);
    expect(result.failed).toEqual([]);
    expect(result.undetermined).toEqual(["minHba1cScaled"]);
  });

  it("treats an empty vault as undetermined, never as a rejection", () => {
    const { witness, missing } = deriveWitness(SYNTHETIC_PATIENT_ID, []);
    const result = evaluateLocalMatch(witness, STUDY_001.criteria, missing);
    expect(result.failed).toEqual([]);
    expect(result.undetermined).toHaveLength(5);
  });

  it("uses the most recent study per field when deriving the witness", () => {
    const { witness, missing } = deriveWitness(SYNTHETIC_PATIENT_ID, [
      medicalStudy({ id: "old", issuedAt: "2024-01-01", hba1cScaled: 60 }),
      medicalStudy({ id: "new", issuedAt: "2026-05-01", hba1cScaled: 81 }),
    ]);
    expect(witness.hba1cScaled).toBe(81);
    expect(missing).toContain("diagnosis");
  });
});
