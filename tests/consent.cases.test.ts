import { describe, expect, it } from "vitest";
import { SYNTHETIC_PATIENT_ALIAS } from "@/domain/medical/constants";
import { STUDY_001 } from "@/domain/study/study001";
import { DemoMidnightAdapter } from "@/lib/midnight/DemoMidnightAdapter";
import { MidnightAdapterError } from "@/lib/midnight/errors";

/**
 * Hackathon QA cases 4–5.
 * Consent application logic via DemoMidnightAdapter — not Compact verification.
 */
describe("Consent QA cases (demo adapter)", () => {
  it("CASE 4: valid consent → ACTIVE", async () => {
    const adapter = new DemoMidnightAdapter();
    const grant = await adapter.grantConsent({
      studyId: STUDY_001.id,
      patientAlias: SYNTHETIC_PATIENT_ALIAS,
      researcherAlias: STUDY_001.researcherAlias,
      scope: { fields: ["treatment", "treatment_duration"] },
      purpose: "Type 2 Diabetes Research",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      rewardAmount: 25,
      rewardSymbol: "TEST",
    });

    expect(grant.status).toBe("confirmed");
    expect(adapter.getDemoConsentStatus(STUDY_001.id, SYNTHETIC_PATIENT_ALIAS)).toBe(
      "active",
    );
  });

  it("CASE 5: revoked consent → REVOKED / access denied", async () => {
    const adapter = new DemoMidnightAdapter();
    const grant = await adapter.grantConsent({
      studyId: STUDY_001.id,
      patientAlias: SYNTHETIC_PATIENT_ALIAS,
      researcherAlias: STUDY_001.researcherAlias,
      scope: { fields: ["treatment", "treatment_duration"] },
      purpose: "Type 2 Diabetes Research",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      rewardAmount: 25,
      rewardSymbol: "TEST",
    });

    const revoke = await adapter.revokeConsent({
      studyId: STUDY_001.id,
      patientAlias: SYNTHETIC_PATIENT_ALIAS,
      consentTransactionId: grant.transactionId,
    });

    expect(revoke.status).toBe("confirmed");
    expect(adapter.getDemoConsentStatus(STUDY_001.id, SYNTHETIC_PATIENT_ALIAS)).toBe(
      "revoked",
    );

    await expect(
      adapter.claimReward({
        studyId: STUDY_001.id,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        rewardAmount: 25,
        rewardSymbol: "TEST",
      }),
    ).rejects.toBeInstanceOf(MidnightAdapterError);

    await expect(
      adapter.revokeConsent({
        studyId: STUDY_001.id,
        patientAlias: SYNTHETIC_PATIENT_ALIAS,
        consentTransactionId: revoke.transactionId,
      }),
    ).rejects.toMatchObject({ code: "CONSENT_ALREADY_REVOKED" });
  });
});
