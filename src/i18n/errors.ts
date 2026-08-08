import type { ErrorMessageKey } from "@/i18n/keys";
import { es } from "@/i18n/messages/es";

/**
 * Error translation happens here, at the presentation layer.
 *
 * The adapters and providers raise stable machine codes (`STUDY_INACTIVE`,
 * `WALLET_NOT_CONNECTED`, …) with English developer text attached. The UI never
 * renders that text — it renders the translation of the code. That keeps the
 * dictionaries the only place user-facing wording lives, and it means files
 * owned by other parts of the codebase never need to know about locales.
 */
const KNOWN_CODES: ReadonlySet<string> = new Set(
  Object.keys(es.errors).filter((key) => key !== "title"),
);

export function isKnownErrorCode(code: string): boolean {
  return KNOWN_CODES.has(code);
}

/** Map an adapter error code to a translation key, falling back to a generic one. */
export function errorMessageKey(code: string | null | undefined): ErrorMessageKey {
  if (code && KNOWN_CODES.has(code)) {
    return `errors.${code}` as ErrorMessageKey;
  }
  return "errors.UNKNOWN_ERROR";
}
