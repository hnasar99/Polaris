/**
 * Wallet-boundary errors safe for UI (no medical / private payload data).
 */
export class WalletAdapterError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WalletAdapterError";
    this.code = code;
  }
}

export const WALLET_NOT_CONNECTED = "Wallet not connected" as const;
export const WALLET_EXTENSION_MISSING =
  "No Midnight wallet found. Please install a Midnight wallet extension (e.g. 1AM)." as const;
export const WALLET_SUBMIT_NOT_WIRED =
  "Midnight wallet is connected for address/session only. Transaction submit (prove → balance → submit) is not wired yet — see midnight/integration." as const;
