import { describe, expect, it } from "vitest";
import {
  coerceCircuitBoolean,
  extractCircuitResult,
} from "@/lib/midnight/polaris-tx";

describe("extractCircuitResult", () => {
  it("reads private.result from createUnprovenCallTx shape", () => {
    expect(
      extractCircuitResult({
        public: { nextContractState: null, publicTranscript: [], partitionedTranscript: null },
        private: { result: true, unprovenTx: {} },
      }),
    ).toBe(true);
  });

  it("reads callTxData.private.result from submitCallTxAsync shape", () => {
    expect(
      extractCircuitResult({
        txId: "tx_abc",
        callTxData: {
          public: {},
          private: { result: true, unprovenTx: {} },
        },
      }),
    ).toBe(true);

    expect(
      extractCircuitResult({
        txId: "tx_abc",
        callTxData: {
          public: {},
          private: { result: false, unprovenTx: {} },
        },
      }),
    ).toBe(false);
  });

  it("does not treat a missing result as false", () => {
    expect(
      extractCircuitResult({
        txId: "tx_abc",
        callTxData: { public: {}, private: { unprovenTx: {} } },
      }),
    ).toBeUndefined();
  });
});

describe("coerceCircuitBoolean", () => {
  it("accepts JS and Compact-ish truthy forms", () => {
    expect(coerceCircuitBoolean(true)).toBe(true);
    expect(coerceCircuitBoolean(false)).toBe(false);
    expect(coerceCircuitBoolean(1n)).toBe(true);
    expect(coerceCircuitBoolean(0n)).toBe(false);
    expect(coerceCircuitBoolean(undefined)).toBeUndefined();
  });
});
