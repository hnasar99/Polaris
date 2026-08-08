import type { ConnectedSession } from "@/lib/midnight/session";
import {
  getConfiguredNetworkId,
  getMidnightNetworkId,
  LEGACY_NETWORK,
} from "@/lib/wallet/network";

export type MidnightRuntimeState = {
  session: ConnectedSession | null;
  contractAddress: string | null;
  dappSecret: Uint8Array | null;
};

const state: MidnightRuntimeState = {
  session: null,
  contractAddress: readEnvContractAddress(),
  dappSecret: null,
};

/**
 * A deploy only exists on the network it was made on, so the stored address is
 * scoped per network — otherwise switching networks silently points every
 * circuit call at an address the new chain has never seen.
 */
const ADDRESS_KEY_PREFIX = "polaris:contract-address";

/** Network the cached address was read for; null before the first read. */
let loadedForNetwork: string | null = null;

function addressKey(network: string): string {
  return `${ADDRESS_KEY_PREFIX}:${network}`;
}

function readEnvContractAddress(): string | null {
  const value = process.env.NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * The unprefixed key predates scoping, and back then the app could only reach
 * one network, so that is where such an address belongs.
 */
function migrateLegacyAddress(): void {
  const legacy = window.localStorage.getItem(ADDRESS_KEY_PREFIX);
  if (!legacy) return;
  window.localStorage.removeItem(ADDRESS_KEY_PREFIX);
  const key = addressKey(LEGACY_NETWORK);
  if (!window.localStorage.getItem(key)) {
    window.localStorage.setItem(key, legacy);
  }
}

export function getMidnightRuntime(): MidnightRuntimeState {
  return state;
}

export function setMidnightSession(session: ConnectedSession | null): void {
  state.session = session;
}

export function setMidnightContractAddress(address: string | null): void {
  state.contractAddress = address;
  if (typeof window === "undefined") return;
  const network = getMidnightNetworkId();
  loadedForNetwork = network;
  if (address) window.localStorage.setItem(addressKey(network), address);
  else window.localStorage.removeItem(addressKey(network));
}

export function loadPersistedContractAddress(): string | null {
  if (typeof window === "undefined") {
    return state.contractAddress ?? readEnvContractAddress();
  }
  const network = getMidnightNetworkId();
  if (loadedForNetwork === network) return state.contractAddress;

  migrateLegacyAddress();
  const stored = window.localStorage.getItem(addressKey(network));
  loadedForNetwork = network;
  // The build-time address was deployed on the build-time network, so it is not
  // a fallback for any other one.
  const fallback =
    network === getConfiguredNetworkId() ? readEnvContractAddress() : null;
  state.contractAddress = stored && stored.length > 0 ? stored : fallback;
  return state.contractAddress;
}

export function setMidnightDappSecret(secret: Uint8Array | null): void {
  state.dappSecret = secret;
}

export function clearMidnightRuntime(): void {
  state.session = null;
  // Keep contract address + secret across disconnect (join same deploy).
}
