/**
 * Per-research progress for the connected patient.
 *
 * The ledger stores eligibility/claim nullifiers and consent records keyed by
 * hashes computed *inside* the circuit, so a client cannot look up "my consent"
 * from the public state. We therefore keep the patient's own view of progress in
 * this browser, scoped by contract address. The contract remains the authority:
 * every action re-asserts its own preconditions and fails if this view drifts.
 */

import type { ConsentScopeField } from "@/domain/consent/types";

export type EligibilityStatus =
  | "idle"
  | "checking"
  | "eligible"
  | "not_eligible"
  | "error";

export type ConsentStatus = "none" | "pending" | "active" | "revoked" | "error";

export type RewardStatus =
  | "locked"
  | "available"
  | "claiming"
  | "claimed"
  | "error";

export type StudyProgress = {
  eligibility: EligibilityStatus;
  proofReference: string | null;
  eligibilityTxId: string | null;
  consent: ConsentStatus;
  consentTxId: string | null;
  consentScope: ConsentScopeField[];
  consentPurpose: string | null;
  consentExpiresAt: string | null;
  reward: RewardStatus;
  rewardTxId: string | null;
  errorCode: string | null;
};

export type ProgressMap = Record<string, StudyProgress>;

export function emptyProgress(): StudyProgress {
  return {
    eligibility: "idle",
    proofReference: null,
    eligibilityTxId: null,
    consent: "none",
    consentTxId: null,
    consentScope: [],
    consentPurpose: null,
    consentExpiresAt: null,
    reward: "locked",
    rewardTxId: null,
    errorCode: null,
  };
}

/** Drop in-flight states so a reload never shows a stuck spinner. */
function settle(progress: StudyProgress): StudyProgress {
  return {
    ...progress,
    eligibility: progress.eligibility === "checking" ? "idle" : progress.eligibility,
    consent: progress.consent === "pending" ? "none" : progress.consent,
    reward: progress.reward === "claiming" ? "available" : progress.reward,
  };
}

function keyFor(contractAddress: string): string {
  return `polaris:progress:${contractAddress}`;
}

export function loadProgress(contractAddress: string | null): ProgressMap {
  if (!contractAddress || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(keyFor(contractAddress));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const out: ProgressMap = {};
    for (const [id, value] of Object.entries(parsed as ProgressMap)) {
      out[id] = settle({ ...emptyProgress(), ...value });
    }
    return out;
  } catch {
    return {};
  }
}

export function saveProgress(
  contractAddress: string | null,
  progress: ProgressMap,
): void {
  if (!contractAddress || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(contractAddress), JSON.stringify(progress));
  } catch {
    // Best effort — the contract is the source of truth.
  }
}
