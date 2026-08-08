/**
 * Encoding helpers for Compact witnesses.
 * App adapter copy: `src/lib/midnight/encoding.ts` — keep behavior in sync.
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

/** Consent scope bitmask matching polaris-health.compact ConsentRecord.scopeMask */
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

export async function hashPurpose(purpose: string): Promise<Uint8Array> {
  const data = TEXT.encode(purpose);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(digest);
  }
  return pad32(purpose);
}
