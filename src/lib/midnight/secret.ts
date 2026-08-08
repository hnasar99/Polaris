const STORAGE_KEY = "polaris:dapp-secret-v1";

/**
 * Persistent 32-byte DApp secret for Compact identity (patient/researcher).
 * Not a wallet seed — domain-separated in-circuit via persistentHash.
 */
export function getOrCreateDappSecret(): Uint8Array {
  if (typeof window === "undefined" || !window.localStorage) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && /^[0-9a-fA-F]{64}$/.test(existing)) {
    return hexToBytes(existing);
  }

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  window.localStorage.setItem(STORAGE_KEY, bytesToHex(bytes));
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
}
