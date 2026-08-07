import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_PATIENT_ID,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import type { PrivateMedicalWitness } from "@/domain/medical/types";
import { STUDY_001 } from "@/domain/study/study001";
import { DemoMidnightAdapter } from "@/lib/midnight/DemoMidnightAdapter";

/**
 * Hackathon QA cases 1–3.
 * These exercise DemoMidnightAdapter / application logic — NOT Compact verification.
 */
function baseWitness(
  overrides: Partial<PrivateMedicalWitness> = {},
): PrivateMedicalWitness {
  return {
    patientId: SYNTHETIC_PATIENT_ID,
    age: 47,
    diagnosis: DIAGNOSIS_TYPE_2_DIABETES,
    hba1cScaled: 81,
    treatment: TREATMENT_METFORMIN,
    treatmentMonths: 18,
    issuerId: ISSUER_HOSPITAL_DEMO,
    ...overrides,
  };
}

describe("Eligibility QA cases (demo adapter)", () => {
  it("CASE 1: qualifying patient → ELIGIBLE", async () => {
    const adapter = new DemoMidnightAdapter();
    const result = await adapter.proveEligibility({
      studyId: STUDY_001.id,
      criteria: STUDY_001.criteria,
      privateWitness: baseWitness(),
    });
    expect(result.eligible).toBe(true);
    expect(result.demoMode).toBe(true);
    expect(result).not.toHaveProperty("age");
    expect(result).not.toHaveProperty("hba1cScaled");
    expect(result).not.toHaveProperty("privateWitness");
  });

  it("CASE 2: age below min → NOT ELIGIBLE", async () => {
    const adapter = new DemoMidnightAdapter();
    const result = await adapter.proveEligibility({
      studyId: STUDY_001.id,
      criteria: STUDY_001.criteria,
      privateWitness: baseWitness({ age: 35 }),
    });
    expect(result.eligible).toBe(false);
  });

  it("CASE 3: HbA1c below threshold → NOT ELIGIBLE", async () => {
    const adapter = new DemoMidnightAdapter();
    const result = await adapter.proveEligibility({
      studyId: STUDY_001.id,
      criteria: STUDY_001.criteria,
      privateWitness: baseWitness({ hba1cScaled: 65 }),
    });
    expect(result.eligible).toBe(false);
  });
});
