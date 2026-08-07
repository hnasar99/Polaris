import type { PrivateMedicalWitness } from "@/domain/medical/types";
import type { StudyCriteria } from "@/domain/study/types";

/**
 * Private input assembled on the patient client.
 * Never returned from Midnight adapters in response types.
 */
export interface EligibilityProofInput {
  studyId: string;
  criteria: StudyCriteria;
  privateWitness: PrivateMedicalWitness;
}

/**
 * Sanitized eligibility result — excludes all private medical attributes.
 */
export interface EligibilityResult {
  eligible: boolean;
  proofReference: string;
  transactionId: string;
  /** Present only for DemoMidnightAdapter — never claim real ZK verification. */
  demoMode?: boolean;
}
