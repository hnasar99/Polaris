import type { ConsentScope } from "@/domain/consent/types";
import type { StudyCriteria } from "@/domain/study/types";

/**
 * All circuit-facing inputs identify a research by its `externalStudyId`
 * (e.g. "STUDY_001"). The contract key is SHA-256 of that string, so the same
 * id must be used by every circuit — never the Supabase row UUID.
 */
export interface CreateStudyInput {
  externalStudyId: string;
  title: string;
  researcherAlias: string;
  criteria: StudyCriteria;
  /** Reward per participant in NIGHT; converted to Stars by the adapter. */
  rewardAmount: number;
  rewardSymbol: string;
}

export interface GrantConsentInput {
  externalStudyId: string;
  patientAlias: string;
  researcherAlias: string;
  scope: ConsentScope;
  purpose: string;
  expiresAt: string;
  rewardAmount: number;
  rewardSymbol: string;
}

export interface RevokeConsentInput {
  externalStudyId: string;
  patientAlias: string;
  consentTransactionId: string;
}

export interface ClaimRewardInput {
  externalStudyId: string;
  patientAlias: string;
  rewardAmount: number;
  rewardSymbol: string;
}

export interface CloseStudyInput {
  externalStudyId: string;
}

/**
 * Platform vault operations. Laboratories never fund on-chain: they settle with
 * the platform off-chain and every payout is served from this shared vault.
 */
export interface FundVaultInput {
  /** Amount in NIGHT; converted to Stars by the adapter. */
  amountNight: number;
}

export interface WithdrawVaultInput {
  amountNight: number;
  /** Bech32 unshielded address. Defaults to the connected wallet. */
  recipientAddress?: string;
}

/** Result of moving liquidity from one contract vault to another. */
export interface VaultRolloverResult {
  sourceAddress: string;
  targetAddress: string;
  /** False when the source vault had nothing to move. */
  moved: boolean;
  amountNight: number;
  withdrawTransactionId?: string;
  fundTransactionId?: string;
}

/** Public vault projection for the admin console. */
export interface VaultStatus {
  /**
   * False when the ledger could not be read at all — no contract configured, no
   * wallet session, or no compiled bindings. An unread vault is unknown, not
   * empty, so callers must not report it as out of liquidity.
   */
  known: boolean;
  balanceNight: number;
  totalFundedNight: number;
  totalPaidNight: number;
  adminPkHex: string | null;
  /** Whether the DApp secret in this browser is the contract admin. */
  isAdmin: boolean;
}

/**
 * Sanitized transaction result — no private medical fields.
 */
export interface TransactionResult {
  transactionId: string;
  status: "submitted" | "confirmed" | "failed";
}
