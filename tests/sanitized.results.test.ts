import { describe, expect, it } from "vitest";
import type { EligibilityResult } from "@/domain/eligibility/types";
import type { TransactionResult } from "@/types/midnight";

/**
 * Privacy boundary: what adapters hand back to React must never carry a private
 * medical attribute. Enforced structurally so it holds for every adapter, not
 * just the one that happens to be wired today.
 */
const PRIVATE_FIELD_KEYS = [
  "age",
  "diagnosis",
  "hba1cScaled",
  "treatment",
  "treatmentMonths",
  "issuerId",
  "patientId",
  "privateWitness",
  "diagnosisCode",
  "treatmentCode",
] as const;

type PrivateFieldKey = (typeof PRIVATE_FIELD_KEYS)[number];

/** Compile-time guard: fails `tsc` if a private field is ever added. */
type HasNoPrivateFields<T> = Extract<keyof T, PrivateFieldKey> extends never
  ? true
  : false;

const eligibilityIsSanitized: HasNoPrivateFields<EligibilityResult> = true;
const transactionIsSanitized: HasNoPrivateFields<TransactionResult> = true;

function assertNoPrivateMedicalFields(value: object): void {
  const keys = Object.keys(value);
  for (const field of PRIVATE_FIELD_KEYS) {
    expect(keys).not.toContain(field);
  }
}

describe("Sanitized Midnight result types", () => {
  it("declares EligibilityResult and TransactionResult free of private fields", () => {
    expect(eligibilityIsSanitized).toBe(true);
    expect(transactionIsSanitized).toBe(true);
  });

  it("EligibilityResult carries only the proof reference and outcome", () => {
    const result: EligibilityResult = {
      eligible: true,
      proofReference: "0xproof",
      transactionId: "0xtx",
    };

    expect(Object.keys(result).sort()).toEqual([
      "eligible",
      "proofReference",
      "transactionId",
    ]);
    assertNoPrivateMedicalFields(result);
  });

  it("TransactionResult carries only the tx id and status", () => {
    const result: TransactionResult = {
      transactionId: "0xtx",
      status: "confirmed",
    };

    expect(Object.keys(result).sort()).toEqual(["status", "transactionId"]);
    assertNoPrivateMedicalFields(result);
  });
});
