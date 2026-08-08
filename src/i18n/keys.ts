import type { Messages } from "@/i18n/messages/es";

/**
 * Every valid dotted key, e.g. "wallet.connect".
 *
 * Dictionaries are exactly two levels deep (namespace → string), so this stays
 * a cheap mapped type instead of a recursive one. `t()` takes a `MessageKey`,
 * which makes a typo or a removed key a compile error rather than a string
 * echoed back at the user.
 */
export type MessageKey = {
  [N in keyof Messages & string]: `${N}.${keyof Messages[N] & string}`;
}[keyof Messages & string];

/** Namespace of the error dictionary, e.g. "errors.STUDY_INACTIVE". */
export type ErrorMessageKey = `errors.${keyof Messages["errors"] & string}`;
