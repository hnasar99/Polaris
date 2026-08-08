/**
 * Which Midnight network the app connects to.
 *
 * `NEXT_PUBLIC_MIDNIGHT_NETWORK` is only the default: funds live on one network
 * at a time, so the user has to be able to follow their balance without a
 * rebuild. The stored choice wins, and everything downstream (indexer URLs,
 * ledger network id) still comes from the wallet's own session configuration.
 */

import { createLocalStore } from "@/lib/browserStore";
import type { MidnightNetworkId } from "@/lib/wallet/dapp-connector-types";

const NETWORK_KEY = "polaris:network";

const KNOWN_NETWORKS: readonly string[] = [
  "undeployed",
  "preview",
  "preprod",
  "mainnet",
];

/** Networks offered in the UI. Local devnet and mainnet stay env-only. */
const SELECTABLE_NETWORKS: readonly MidnightNetworkId[] = ["preview", "preprod"];

/** The network before the selector existed, so a stale deploy can be re-scoped. */
export const LEGACY_NETWORK: MidnightNetworkId = "preprod";

export const networkStore = createLocalStore(NETWORK_KEY);

export function isMidnightNetworkId(
  value: unknown,
): value is MidnightNetworkId {
  return typeof value === "string" && KNOWN_NETWORKS.includes(value);
}

/** Build-time default. */
export function getConfiguredNetworkId(): MidnightNetworkId {
  const value = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK?.trim();
  return isMidnightNetworkId(value) ? value : LEGACY_NETWORK;
}

/** Resolve a raw stored value, falling back to the build-time default. */
export function resolveNetworkId(stored: string | null): MidnightNetworkId {
  return isMidnightNetworkId(stored) ? stored : getConfiguredNetworkId();
}

/** The network the next connect() will target. */
export function getMidnightNetworkId(): MidnightNetworkId {
  if (typeof window === "undefined" || !window.localStorage) {
    return getConfiguredNetworkId();
  }
  return resolveNetworkId(window.localStorage.getItem(NETWORK_KEY));
}

export function listSelectableNetworks(): MidnightNetworkId[] {
  const configured = getConfiguredNetworkId();
  return SELECTABLE_NETWORKS.includes(configured)
    ? [...SELECTABLE_NETWORKS]
    : [...SELECTABLE_NETWORKS, configured];
}
