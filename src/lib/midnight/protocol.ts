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

/**
 * Application boundary for Midnight Compact contract operations.
 *
 * Real Compact bindings must be wired into MidnightAdapter.
 * Do not invent Compact syntax or generated binding shapes here.
 */
export interface MidnightHealthProtocol {
  createStudy(input: CreateStudyInput): Promise<TransactionResult>;
  proveEligibility(input: EligibilityProofInput): Promise<EligibilityResult>;
  grantConsent(input: GrantConsentInput): Promise<TransactionResult>;
  revokeConsent(input: RevokeConsentInput): Promise<TransactionResult>;
  claimReward(input: ClaimRewardInput): Promise<TransactionResult>;
}
