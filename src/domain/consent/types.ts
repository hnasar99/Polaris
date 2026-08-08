/**
 * Consent scope fields. Each maps to one bit of ConsentRecord.scopeMask in
 * polaris-health.compact (see lib/midnight/encoding.ts for the bit values).
 */
export type ConsentScopeField =
  | "diagnosis"
  | "lab_result"
  | "treatment"
  | "treatment_duration";

export const CONSENT_SCOPE_FIELDS: ConsentScopeField[] = [
  "diagnosis",
  "lab_result",
  "treatment",
  "treatment_duration",
];

export interface ConsentScope {
  fields: ConsentScopeField[];
}

/** UI projection of consent — Midnight is the eventual source of truth. */
export interface ConsentView {
  id: string;
  studyId: string;
  patientId: string;
  status: "none" | "pending" | "active" | "revoked" | "expired" | "error";
  scope: ConsentScope;
  purpose: string;
  expiresAt: string;
  blockchainTxId: string | null;
  createdAt: string;
}

export const DEFAULT_CONSENT_PURPOSE = "Type 2 Diabetes Research";
export const DEFAULT_CONSENT_DURATION_DAYS = 30;
