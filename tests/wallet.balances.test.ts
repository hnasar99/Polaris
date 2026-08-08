import { describe, expect, it } from "vitest";
import { readUnshieldedBalanceNight } from "@/lib/wallet/balances";
import type { MidnightConnectedAPI } from "@/lib/wallet/dapp-connector-types";

describe("readUnshieldedBalanceNight", () => {
  it("sums token balances and converts Stars to NIGHT", async () => {
    const api = {
      getUnshieldedBalances: async () => ({
        night: 3_500_000n,
        other: 500_000n,
      }),
    } as unknown as MidnightConnectedAPI;

    expect(await readUnshieldedBalanceNight(api)).toBe(4);
  });

  it("returns null when the wallet API has no balance method", async () => {
    const api = {} as MidnightConnectedAPI;
    expect(await readUnshieldedBalanceNight(api)).toBeNull();
  });
});
