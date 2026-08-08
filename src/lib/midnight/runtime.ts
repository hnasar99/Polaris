import type { ConnectedSession } from "@/lib/midnight/session";

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

function readEnvContractAddress(): string | null {
  const value = process.env.NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS?.trim();
  return value && value.length > 0 ? value : null;
}

export function getMidnightRuntime(): MidnightRuntimeState {
  return state;
}

export function setMidnightSession(session: ConnectedSession | null): void {
  state.session = session;
}

export function setMidnightContractAddress(address: string | null): void {
  state.contractAddress = address;
  if (typeof window !== "undefined" && address) {
    window.localStorage.setItem("polaris:contract-address", address);
  }
}

export function loadPersistedContractAddress(): string | null {
  if (state.contractAddress) return state.contractAddress;
  if (typeof window === "undefined") return readEnvContractAddress();
  const stored = window.localStorage.getItem("polaris:contract-address");
  if (stored && stored.length > 0) {
    state.contractAddress = stored;
    return stored;
  }
  return readEnvContractAddress();
}

export function setMidnightDappSecret(secret: Uint8Array | null): void {
  state.dappSecret = secret;
}

export function clearMidnightRuntime(): void {
  state.session = null;
  // Keep contract address + secret across disconnect (join same deploy).
}
