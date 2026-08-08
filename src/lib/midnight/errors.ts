import { WalletAdapterError } from "@/lib/wallet/errors";

export class MidnightAdapterError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MidnightAdapterError";
    this.code = code;
  }
}

export const MIDNIGHT_NOT_CONNECTED =
  "Midnight adapter not connected" as const;

export const MIDNIGHT_SESSION_REQUIRED =
  "Midnight session required — connect a wallet (1AM/Lace) first" as const;

export const MIDNIGHT_CONTRACT_ADDRESS_REQUIRED =
  "Polaris contract address required — set NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS or deploy" as const;

export const MIDNIGHT_BINDINGS_MISSING =
  "Compact bindings missing — run npm run compact && npm run sync:zk, then set NEXT_PUBLIC_POLARIS_BINDINGS_READY=true" as const;

const KNOWN_PREFIXES = [
  MIDNIGHT_NOT_CONNECTED,
  MIDNIGHT_SESSION_REQUIRED,
  MIDNIGHT_CONTRACT_ADDRESS_REQUIRED,
  MIDNIGHT_BINDINGS_MISSING,
] as const;

/** Strip potentially sensitive details from errors before UI display. */
export function sanitizeError(error: unknown): {
  code: string;
  message: string;
} {
  if (error instanceof MidnightAdapterError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof WalletAdapterError) {
    // Wallet messages are curated (extension missing, not connected, submit not wired).
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    const msg = error.message;
    for (const known of KNOWN_PREFIXES) {
      if (msg.includes(known)) {
        return { code: knownCodes(known), message: known };
      }
    }
    if (msg.includes("Wallet not connected")) {
      return {
        code: "WALLET_NOT_CONNECTED",
        message: "Wallet not connected",
      };
    }
    if (msg.includes("No Midnight wallet found")) {
      return {
        code: "WALLET_EXTENSION_MISSING",
        message: msg,
      };
    }
    // Never forward raw Error.message that might contain private payloads.
    return {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
  };
}

function knownCodes(message: (typeof KNOWN_PREFIXES)[number]): string {
  if (message === MIDNIGHT_SESSION_REQUIRED) return "MIDNIGHT_SESSION_REQUIRED";
  if (message === MIDNIGHT_CONTRACT_ADDRESS_REQUIRED) {
    return "MIDNIGHT_CONTRACT_ADDRESS_REQUIRED";
  }
  if (message === MIDNIGHT_BINDINGS_MISSING) return "MIDNIGHT_BINDINGS_MISSING";
  return "MIDNIGHT_NOT_CONNECTED";
}
