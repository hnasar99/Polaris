import {
  WALLET_NOT_CONNECTED,
  WalletAdapterError,
} from "@/lib/wallet/errors";
import type { WalletAdapter } from "@/lib/wallet/WalletAdapter";

/**
 * Pure unconnected stub. Throws until a real adapter is selected by the factory.
 */
export class UnconnectedWalletAdapter implements WalletAdapter {
  readonly kind = "unconnected" as const;

  connect(): Promise<string> {
    return Promise.reject(new WalletAdapterError(WALLET_NOT_CONNECTED));
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  getAddress(): string | null {
    return null;
  }

  isConnected(): boolean {
    return false;
  }

  signAndSubmit(_payload: unknown): Promise<string> {
    return Promise.reject(new WalletAdapterError(WALLET_NOT_CONNECTED));
  }
}
