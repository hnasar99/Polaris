import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_TYPE_2_DIABETES,
  ISSUER_HOSPITAL_DEMO,
  SYNTHETIC_PATIENT_ALIAS,
  SYNTHETIC_PATIENT_ID,
  TREATMENT_METFORMIN,
} from "@/domain/medical/constants";
import { STUDY_001 } from "@/domain/study/study001";
import { MidnightAdapter } from "@/lib/midnight/MidnightAdapter";
import {
  MidnightAdapterError,
  MIDNIGHT_SESSION_REQUIRED,
} from "@/lib/midnight/errors";

describe("MidnightAdapter", () => {
  it("fails closed without a wallet session (no silent success)", async () => {
    const adapter = new MidnightAdapter();
    const proveInput = {
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
    };

    const expectSessionRequired = async (fn: () => Promise<unknown>) => {
      await expect(fn()).rejects.toBeInstanceOf(MidnightAdapterError);
      await expect(fn()).rejects.toMatchObject({
        code: "MIDNIGHT_SESSION_REQUIRED",
        message: MIDNIGHT_SESSION_REQUIRED,
      });
    };

    await expectSessionRequired(() => adapter.proveEligibility(proveInput));
    await expectSessionRequired(() =>
      adapter.createStudy({
        externalStudyId: "STUDY_001",
        title: "x",
        researcherAlias: "y",
        criteria: STUDY_001.criteria,
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    );
    await expectSessionRequired(() =>
      adapter.grantConsent({
        externalStudyId: STUDY_001.externalStudyId,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        researcherAlias: STUDY_001.researcherAlias,
        scope: { fields: ["treatment"] },
        purpose: "research",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    );
    await expectSessionRequired(() =>
      adapter.revokeConsent({
        externalStudyId: STUDY_001.externalStudyId,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        consentTransactionId: "tx",
      }),
    );
    await expectSessionRequired(() =>
      adapter.claimReward({
        externalStudyId: STUDY_001.externalStudyId,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    );
  });
});

