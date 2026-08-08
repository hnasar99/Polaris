import type {
  EligibilityProofInput,
  EligibilityResult,
} from "@/domain/eligibility/types";
import type { OnChainStudy } from "@/lib/midnight/polaris-read";
import type {
  ClaimRewardInput,
  CloseStudyInput,
  CreateStudyInput,
  FundVaultInput,
  GrantConsentInput,
  RevokeConsentInput,
  TransactionResult,
  VaultStatus,
  WithdrawVaultInput,
} from "@/types/midnight";

/**
 * Application boundary for Midnight Compact contract operations.
 *
 * Real Compact bindings must be wired into MidnightAdapter.
 * Do not invent Compact syntax or generated binding shapes here.
 */
export interface MidnightHealthProtocol {
  // Platform admin — liquidity vault that pays every participant
  fundVault(input: FundVaultInput): Promise<TransactionResult>;
  withdrawVault(input: WithdrawVaultInput): Promise<TransactionResult>;
  readVault(): Promise<VaultStatus>;

  // Laboratory / researcher (no on-chain funding: studies are paid off-chain)
  createStudy(input: CreateStudyInput): Promise<TransactionResult>;
  closeStudy(input: CloseStudyInput): Promise<TransactionResult>;

  // Patient
  proveEligibility(input: EligibilityProofInput): Promise<EligibilityResult>;
  grantConsent(input: GrantConsentInput): Promise<TransactionResult>;
  revokeConsent(input: RevokeConsentInput): Promise<TransactionResult>;
  claimReward(input: ClaimRewardInput): Promise<TransactionResult>;

  /** Public ledger projection (aggregates only). Empty when unavailable. */
  readStudies(): Promise<OnChainStudy[]>;

  /** hex researcher pk derived from the local DApp secret, when available. */
  getResearcherPkHex?(): Promise<string | null>;
}
