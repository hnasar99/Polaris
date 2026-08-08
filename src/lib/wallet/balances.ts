import type { MidnightConnectedAPI } from "@/lib/wallet/dapp-connector-types";
import { starsToNight } from "@/lib/midnight/encoding";

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.length > 0) return BigInt(value);
  return 0n;
}

/** Sum unshielded token balances from the wallet (Stars) and convert to NIGHT. */
export async function readUnshieldedBalanceNight(
  api: MidnightConnectedAPI,
): Promise<number | null> {
  if (typeof api.getUnshieldedBalances !== "function") return null;

  const balances = await api.getUnshieldedBalances();
  let totalStars = 0n;
  for (const amount of Object.values(balances)) {
    totalStars += toBigInt(amount);
  }
  if (totalStars <= 0n) return 0;
  return starsToNight(totalStars);
}
