/**
 * Wallet-boundary errors safe for UI (no medical / private payload data).
 *
 * `code` must match an `errors.*` i18n key. Developer `message` is English and
 * never rendered — the banner translates the code.
 */

export class WalletAdapterError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "WalletAdapterError";
    this.code = code;
  }
}

/** Machine codes — keep in sync with `errors` in i18n dictionaries. */
export const WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED" as const;
export const WALLET_EXTENSION_MISSING = "WALLET_EXTENSION_MISSING" as const;
export const WALLET_SUBMIT_NOT_WIRED = "WALLET_SUBMIT_NOT_WIRED" as const;
export const WALLET_SSR = "WALLET_SSR" as const;
export const WALLET_CONNECT_REJECTED = "WALLET_CONNECT_REJECTED" as const;
export const WALLET_NETWORK_MISMATCH = "WALLET_NETWORK_MISMATCH" as const;
export const WALLET_SESSION_FAILED = "WALLET_SESSION_FAILED" as const;
export const WALLET_LOCKED = "WALLET_LOCKED" as const;
export const WALLET_CONNECT_TIMEOUT = "WALLET_CONNECT_TIMEOUT" as const;

/**
 * Map a raw extension / session failure into a stable wallet code.
 * Used at the connect boundary so the UI never shows UNKNOWN_ERROR for
 * common 1AM/Lace failures (wrong network, user dismiss, WASM load, …).
 */
export function classifyWalletConnectFailure(error: unknown): WalletAdapterError {
  if (error instanceof WalletAdapterError) return error;

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const lower = msg.toLowerCase();

  // A locked extension is the most common connect failure and the only one the
  // user fixes outside the page, so it must not be folded into "rejected".
  if (
    /is locked|wallet locked|locked wallet|unlock|bloquead|desbloque|enter your password|password required/.test(
      lower,
    )
  ) {
    return new WalletAdapterError(WALLET_LOCKED, msg || WALLET_LOCKED);
  }

  if (
    /reject|denied|deneg|cancel|dismiss|closed by user|user closed|not authorized/.test(
      lower,
    )
  ) {
    return new WalletAdapterError(WALLET_CONNECT_REJECTED, msg || WALLET_CONNECT_REJECTED);
  }

  if (
    /network|preprod|preview|mainnet|undeployed/.test(lower) &&
    /mismatch|unsupported|invalid|wrong|expected|does not match|not match/.test(
      lower,
    )
  ) {
    return new WalletAdapterError(WALLET_NETWORK_MISMATCH, msg || WALLET_NETWORK_MISMATCH);
  }

  if (/no midnight wallet|wallet (extension )?not found|not installed/.test(lower)) {
    return new WalletAdapterError(WALLET_EXTENSION_MISSING, msg || WALLET_EXTENSION_MISSING);
  }

  if (/wallet not connected|not connected/.test(lower)) {
    return new WalletAdapterError(WALLET_NOT_CONNECTED, msg || WALLET_NOT_CONNECTED);
  }

  // Session / WASM / proving setup after the extension approved the dApp.
  if (
    /wasm|webassembly|proving|getproving|getshielded|getconfiguration|async.?module|loading chunk|failed to fetch/.test(
      lower,
    )
  ) {
    return new WalletAdapterError(WALLET_SESSION_FAILED, msg || WALLET_SESSION_FAILED);
  }

  // Any other failure during connect is still a session/connect problem — not
  // a mystery UNKNOWN that hides the failure mode from operators.
  return new WalletAdapterError(
    WALLET_SESSION_FAILED,
    msg || WALLET_SESSION_FAILED,
  );
}
