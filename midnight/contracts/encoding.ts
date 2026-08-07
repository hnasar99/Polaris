/**
 * Encoding helpers shared by Compact witnesses and (later) MidnightAdapter.
 *
 * Compact `pad(32, str)` left-pads / truncates to 32 bytes. We mirror that
 * for diagnosis/treatment codes and study id material passed as Bytes<32>.
 */

const TEXT = new TextEncoder();

/** Mirror Compact pad(32, str): UTF-8 bytes, zero-padded / truncated to 32. */
export function pad32(value: string): Uint8Array {
  const out = new Uint8Array(32);
  const encoded = TEXT.encode(value);
  out.set(encoded.subarray(0, 32));
  return out;
}

/** Encode medical / treatment codes used as Compact Bytes<32> witnesses. */
export function encodeCode(code: string): Uint8Array {
  return pad32(code);
}

/**
 * Study ids in the app are UUID strings. Compact circuits take Bytes<32>.
 * Hash with Web Crypto when available; sync fallback for Node tests.
 */
export async function encodeStudyId(studyId: string): Promise<Uint8Array> {
  const data = TEXT.encode(studyId);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  // Deterministic non-crypto fallback for environments without subtle
  // (tests only). Prefer subtle in production adapter paths.
  return pad32(studyId);
}

/** Consent scope bitmask matching polaris-health.compact */
export const SCOPE_TREATMENT = 0b01;
export const SCOPE_TREATMENT_DURATION = 0b10;

export function encodeConsentScope(fields: string[]): number {
  let mask = 0;
  for (const field of fields) {
    if (field === "treatment") mask |= SCOPE_TREATMENT;
    if (field === "treatment_duration") mask |= SCOPE_TREATMENT_DURATION;
  }
  return mask;
}

export async function hashPurpose(purpose: string): Promise<Uint8Array> {
  const data = TEXT.encode(purpose);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  return pad32(purpose);
}
