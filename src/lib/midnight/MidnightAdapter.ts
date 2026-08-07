import type {
  EligibilityProofInput,
  EligibilityResult,
} from "@/domain/eligibility/types";
import type {
  ClaimRewardInput,
  CreateStudyInput,
  GrantConsentInput,
  RevokeConsentInput,
  TransactionResult,
} from "@/types/midnight";
import {
  MidnightAdapterError,
  MIDNIGHT_NOT_CONNECTED,
} from "@/lib/midnight/errors";
import type { MidnightHealthProtocol } from "@/lib/midnight/protocol";

/**
 * Production-target adapter for real Midnight Compact bindings.
 *
 * Intentionally throws until generated bindings + proof server + wallet
 * submission are wired. Never returns silent fake success.
 *
 * Integration point: see midnight/README.md and midnight/integration/
 */
export class MidnightAdapter implements MidnightHealthProtocol {
  private notConnected(): never {
    // Do not log private medical attributes.
    throw new MidnightAdapterError(
      "MIDNIGHT_NOT_CONNECTED",
      MIDNIGHT_NOT_CONNECTED,
    );
  }

  async createStudy(_input: CreateStudyInput): Promise<TransactionResult> {
    this.notConnected();
  }

  async proveEligibility(
    _input: EligibilityProofInput,
  ): Promise<EligibilityResult> {
    this.notConnected();
  }

  async grantConsent(_input: GrantConsentInput): Promise<TransactionResult> {
    this.notConnected();
  }

  async revokeConsent(_input: RevokeConsentInput): Promise<TransactionResult> {
    this.notConnected();
  }

  async claimReward(_input: ClaimRewardInput): Promise<TransactionResult> {
    this.notConnected();
  }
}
