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
  MIDNIGHT_NOT_CONNECTED,
} from "@/lib/midnight/errors";

describe("MidnightAdapter", () => {
  it("throws clear not-connected errors on every protocol method (no silent success)", async () => {
    const adapter = new MidnightAdapter();
    const proveInput = {
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
    };

    const expectNotConnected = async (fn: () => Promise<unknown>) => {
      await expect(fn()).rejects.toBeInstanceOf(MidnightAdapterError);
      await expect(fn()).rejects.toMatchObject({
        code: "MIDNIGHT_NOT_CONNECTED",
        message: MIDNIGHT_NOT_CONNECTED,
      });
    };

    await expectNotConnected(() => adapter.proveEligibility(proveInput));
    await expectNotConnected(() =>
      adapter.createStudy({
        externalStudyId: "STUDY_001",
        title: "x",
        researcherAlias: "y",
        criteria: STUDY_001.criteria,
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    );
    await expectNotConnected(() =>
      adapter.grantConsent({
        studyId: STUDY_001.id,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        researcherAlias: STUDY_001.researcherAlias,
        scope: { fields: ["treatment"] },
        purpose: "research",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    );
    await expectNotConnected(() =>
      adapter.revokeConsent({
        studyId: STUDY_001.id,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        consentTransactionId: "tx",
      }),
    );
    await expectNotConnected(() =>
      adapter.claimReward({
        studyId: STUDY_001.id,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    );
  });
});
