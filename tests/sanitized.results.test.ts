import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_PATIENT_ALIAS,
  SYNTHETIC_PATIENT_ID,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import type { EligibilityResult } from "@/domain/eligibility/types";
import { STUDY_001 } from "@/domain/study/study001";
import { DemoMidnightAdapter } from "@/lib/midnight/DemoMidnightAdapter";
import type { TransactionResult } from "@/types/midnight";

const PRIVATE_FIELD_KEYS = [
  "age",
  "diagnosis",
  "hba1cScaled",
  "treatment",
  "treatmentMonths",
  "issuerId",
  "patientId",
  "privateWitness",
  "diagnosisCode",
  "treatmentCode",
] as const;

function assertNoPrivateMedicalFields(value: object): void {
  const keys = Object.keys(value);
  for (const field of PRIVATE_FIELD_KEYS) {
    expect(keys).not.toContain(field);
  }
}

describe("Sanitized Midnight result types", () => {
  it("EligibilityResult excludes private medical fields", async () => {
    const adapter = new DemoMidnightAdapter();
    const result: EligibilityResult = await adapter.proveEligibility({
      studyId: STUDY_001.id,
      criteria: STUDY_001.criteria,
      privateWitness: {
        patientId: SYNTHETIC_PATIENT_ID,
        age: 47,
        diagnosis: DIAGNOSIS_TYPE_2_DIABETES,
        hba1cScaled: 81,
        treatment: TREATMENT_METFORMIN,
        treatmentMonths: 18,
        issuerId: ISSUER_HOSPITAL_DEMO,
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        eligible: expect.any(Boolean),
        proofReference: expect.any(String),
        transactionId: expect.any(String),
        demoMode: true,
      }),
    );
    assertNoPrivateMedicalFields(result);
  });

  it("TransactionResult from consent/reward excludes private medical fields", async () => {
    const adapter = new DemoMidnightAdapter();
    const grant: TransactionResult = await adapter.grantConsent({
      studyId: STUDY_001.id,
      patientAlias: SYNTHETIC_PATIENT_ALIAS,
      researcherAlias: STUDY_001.researcherAlias,
      scope: { fields: ["treatment", "treatment_duration"] },
      purpose: "Type 2 Diabetes Research",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      rewardAmount: 25,
      rewardSymbol: "TEST",
    });

    assertNoPrivateMedicalFields(grant);

    const claim: TransactionResult = await adapter.claimReward({
      studyId: STUDY_001.id,
      patientAlias: SYNTHETIC_PATIENT_ALIAS,
      rewardAmount: 25,
      rewardSymbol: "TEST",
    });

    assertNoPrivateMedicalFields(claim);
    expect(claim.demoMode).toBe(true);
  });
});
