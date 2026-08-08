/**
 * NIGHT → USD estimate shown next to compensation amounts.
 *
 * There is no on-chain oracle in this app: the rate is an indicative display
 * value only, configurable so a deployment can keep it current.
 */
export const NIGHT_USD_RATE = Number(
  process.env.NEXT_PUBLIC_NIGHT_USD_RATE ?? "0.35",
);

export function nightToUsd(night: number): number {
  return night * NIGHT_USD_RATE;
}
