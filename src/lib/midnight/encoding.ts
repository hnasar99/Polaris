/**
 * Encoding helpers shared by MidnightAdapter and Compact witnesses.
 * Mirrors midnight/contracts/encoding.ts (keep behavior in sync).
 */

const TEXT = new TextEncoder();

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string from wallet.");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Mirror Compact pad(32, str): UTF-8 bytes, zero-padded / truncated to 32. */
export function pad32(value: string): Uint8Array {
  const out = new Uint8Array(32);
  const encoded = TEXT.encode(value);
  out.set(encoded.subarray(0, 32));
  return out;
}

export function encodeCode(code: string): Uint8Array {
  return pad32(code);
}

export async function encodeStudyId(studyId: string): Promise<Uint8Array> {
  const data = TEXT.encode(studyId);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  return pad32(studyId);
}

export const SCOPE_DIAGNOSIS = 0b0001;
export const SCOPE_LAB_RESULT = 0b0010;
export const SCOPE_TREATMENT = 0b0100;
export const SCOPE_TREATMENT_DURATION = 0b1000;

const SCOPE_BITS: Record<string, number> = {
  diagnosis: SCOPE_DIAGNOSIS,
  lab_result: SCOPE_LAB_RESULT,
  treatment: SCOPE_TREATMENT,
  treatment_duration: SCOPE_TREATMENT_DURATION,
};

export function encodeConsentScope(fields: string[]): number {
  let mask = 0;
  for (const field of fields) {
    mask |= SCOPE_BITS[field] ?? 0;
  }
  return mask;
}

export function decodeConsentScope(mask: number): string[] {
  return Object.entries(SCOPE_BITS)
    .filter(([, bit]) => (mask & bit) !== 0)
    .map(([field]) => field);
}

/** 1 NIGHT = 1_000_000 Stars (unshielded ledger unit). */
export const STARS_PER_NIGHT = 1_000_000n;

export function nightToStars(night: number): bigint {
  if (!Number.isFinite(night) || night < 0) {
    throw new Error("Invalid NIGHT amount");
  }
  return BigInt(Math.round(night * 1_000_000));
}

export function starsToNight(stars: bigint): number {
  return Number(stars) / 1_000_000;
}

export async function hashPurpose(purpose: string): Promise<Uint8Array> {
  const data = TEXT.encode(purpose);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  return pad32(purpose);
}

export function toUnixSeconds(iso: string): bigint {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    throw new Error("Invalid expiresAt timestamp");
  }
  return BigInt(Math.floor(ms / 1000));
}
