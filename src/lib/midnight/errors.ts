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
    if (msg.includes(MIDNIGHT_NOT_CONNECTED)) {
      return {
        code: "MIDNIGHT_NOT_CONNECTED",
        message: MIDNIGHT_NOT_CONNECTED,
      };
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
