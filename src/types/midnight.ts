import type { ConsentScope } from "@/domain/consent/types";
import type { StudyCriteria } from "@/domain/study/types";

export interface CreateStudyInput {
  externalStudyId: string;
  title: string;
  researcherAlias: string;
  criteria: StudyCriteria;
  rewardAmount: number;
  rewardSymbol: string;
}

export interface GrantConsentInput {
  studyId: string;
  patientAlias: string;
  researcherAlias: string;
  scope: ConsentScope;
  purpose: string;
  expiresAt: string;
  rewardAmount: number;
  rewardSymbol: string;
}

export interface RevokeConsentInput {
  studyId: string;
  patientAlias: string;
  consentTransactionId: string;
}

export interface ClaimRewardInput {
  studyId: string;
  patientAlias: string;
  rewardAmount: number;
  rewardSymbol: string;
}

/**
 * Sanitized transaction result — no private medical fields.
 */
export interface TransactionResult {
  transactionId: string;
  status: "submitted" | "confirmed" | "failed";
  /** Present only for DemoMidnightAdapter. */
  demoMode?: boolean;
}
