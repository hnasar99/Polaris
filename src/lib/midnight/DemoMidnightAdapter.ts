import type {
  EligibilityProofInput,
  EligibilityResult,
} from "@/domain/eligibility/types";
import type { PrivateMedicalWitness } from "@/domain/medical/types";
import type { StudyCriteria } from "@/domain/study/types";
import type {
  ClaimRewardInput,
  CreateStudyInput,
  GrantConsentInput,
  RevokeConsentInput,
  TransactionResult,
} from "@/types/midnight";
import { MidnightAdapterError } from "@/lib/midnight/errors";
import type { MidnightHealthProtocol } from "@/lib/midnight/protocol";

/**
 * DEMO PRIVACY ENGINE — local evaluation only.
 *
 * Enabled solely when NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true.
 * Results must never be labeled as "ZK proof verified on Midnight".
 *
 * Eligibility criteria are evaluated here (adapter boundary), not in React
 * product components and not via Supabase SQL.
 */
export class DemoMidnightAdapter implements MidnightHealthProtocol {
  readonly label = "DEMO PRIVACY ENGINE" as const;

  private consentStore = new Map<
    string,
    { status: "active" | "revoked"; txId: string }
  >();
  private claimedRewards = new Set<string>();
  private studyActive = new Map<string, boolean>();

  private demoTx(prefix: string): string {
    return `demo_${prefix}_${Date.now().toString(36)}`;
  }

  /**
   * Local criteria check used ONLY by the demo adapter.
   * Mirrors the intended Compact circuit predicate conceptually.
   */
  static evaluateCriteriaLocally(
    witness: PrivateMedicalWitness,
    criteria: StudyCriteria,
  ): boolean {
    return (
      witness.age >= criteria.minAge &&
      witness.diagnosis === criteria.requiredDiagnosis &&
      witness.hba1cScaled >= criteria.minHba1cScaled &&
      witness.treatment === criteria.requiredTreatment &&
      witness.treatmentMonths >= criteria.minTreatmentMonths
    );
  }

  async createStudy(input: CreateStudyInput): Promise<TransactionResult> {
    this.studyActive.set(input.externalStudyId, true);
    return {
      transactionId: this.demoTx("create_study"),
      status: "confirmed",
      demoMode: true,
    };
  }

  async proveEligibility(
    input: EligibilityProofInput,
  ): Promise<EligibilityResult> {
    if (this.studyActive.has(input.studyId) === false) {
      // Studies created outside this adapter instance are treated as active for demo.
      this.studyActive.set(input.studyId, true);
    }
    if (this.studyActive.get(input.studyId) === false) {
      throw new MidnightAdapterError(
        "STUDY_INACTIVE",
        "Study inactive",
      );
    }

    // Never log private medical attributes from the witness.
    const eligible = DemoMidnightAdapter.evaluateCriteriaLocally(
      input.privateWitness,
      input.criteria,
    );

    return {
      eligible,
      proofReference: `demo_proof_${eligible ? "eligible" : "not_eligible"}`,
      transactionId: this.demoTx("prove"),
      demoMode: true,
    };
  }

  async grantConsent(input: GrantConsentInput): Promise<TransactionResult> {
    const key = `${input.studyId}:${input.patientAlias}`;
    const existing = this.consentStore.get(key);
    if (existing?.status === "active") {
      return {
        transactionId: existing.txId,
        status: "confirmed",
        demoMode: true,
      };
    }
    const txId = this.demoTx("grant_consent");
    this.consentStore.set(key, { status: "active", txId });
    return { transactionId: txId, status: "confirmed", demoMode: true };
  }

  async revokeConsent(input: RevokeConsentInput): Promise<TransactionResult> {
    const key = `${input.studyId}:${input.patientAlias}`;
    const existing = this.consentStore.get(key);
    if (!existing || existing.status === "revoked") {
      throw new MidnightAdapterError(
        "CONSENT_ALREADY_REVOKED",
        "Consent already revoked",
      );
    }
    const txId = this.demoTx("revoke_consent");
    this.consentStore.set(key, { status: "revoked", txId });
    return { transactionId: txId, status: "confirmed", demoMode: true };
  }

  async claimReward(input: ClaimRewardInput): Promise<TransactionResult> {
    const key = `${input.studyId}:${input.patientAlias}`;
    const consent = this.consentStore.get(key);
    if (!consent || consent.status !== "active") {
      throw new MidnightAdapterError(
        "CONSENT_REQUIRED",
        "Active consent required to claim reward",
      );
    }
    if (this.claimedRewards.has(key)) {
      throw new MidnightAdapterError(
        "REWARD_ALREADY_CLAIMED",
        "Reward already claimed",
      );
    }
    this.claimedRewards.add(key);
    return {
      transactionId: this.demoTx("claim_reward"),
      status: "confirmed",
      demoMode: true,
    };
  }

  /** Test helper — inspect demo consent without exposing medical data. */
  getDemoConsentStatus(
    studyId: string,
    patientAlias: string,
  ): "none" | "active" | "revoked" {
    return this.consentStore.get(`${studyId}:${patientAlias}`)?.status ?? "none";
  }
}
