import { beforeAll, describe, expect, it } from "vitest";
import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_PATIENT_ALIAS,
  SYNTHETIC_PATIENT_ID,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import { STUDY_001 } from "@/domain/study/study001";
import { createMidnightProtocol } from "@/lib/midnight/factory";
import { MIDNIGHT_SESSION_REQUIRED } from "@/lib/midnight/errors";

/**
 * There is only one protocol path: the Compact-backed MidnightAdapter, loaded
 * lazily so its WASM never lands in the eager client graph. Every circuit call
 * must fail closed until a wallet session is bound — never a simulated result.
 */
describe("createMidnightProtocol factory", () => {
  // The proxy resolves MidnightAdapter on first call; loading its Compact WASM
  // takes far longer than the default per-test timeout, so the hook budget is
  // raised in vitest.config.mts rather than inline here.
  beforeAll(async () => {
    await import("@/lib/midnight/MidnightAdapter");
  });

  it("fails closed on eligibility until a wallet session is bound", async () => {
    const protocol = createMidnightProtocol();
    await expect(
      protocol.proveEligibility({
        externalStudyId: STUDY_001.externalStudyId,
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
      }),
    ).rejects.toMatchObject({
      code: "MIDNIGHT_SESSION_REQUIRED",
      message: MIDNIGHT_SESSION_REQUIRED,
    });
  });

  it("fails closed on consent and reward until a wallet session is bound", async () => {
    const protocol = createMidnightProtocol();

    await expect(
      protocol.grantConsent({
        externalStudyId: STUDY_001.externalStudyId,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        researcherAlias: STUDY_001.researcherAlias,
        scope: { fields: ["treatment", "treatment_duration"] },
        purpose: "Type 2 Diabetes Research",
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    ).rejects.toMatchObject({ code: "MIDNIGHT_SESSION_REQUIRED" });

    await expect(
      protocol.claimReward({
        externalStudyId: STUDY_001.externalStudyId,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    ).rejects.toMatchObject({ code: "MIDNIGHT_SESSION_REQUIRED" });
  });

  it("exposes the full protocol surface through the lazy proxy", () => {
    const protocol = createMidnightProtocol();
    for (const method of [
      "fundVault",
      "withdrawVault",
      "readVault",
      "createStudy",
      "closeStudy",
      "proveEligibility",
      "grantConsent",
      "revokeConsent",
      "claimReward",
      "readStudies",
      "getResearcherPkHex",
    ] as const) {
      expect(typeof protocol[method]).toBe("function");
    }
  });
});
