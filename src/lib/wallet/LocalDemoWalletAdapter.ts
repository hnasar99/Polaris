import {
  WALLET_NOT_CONNECTED,
  WalletAdapterError,
} from "@/lib/wallet/errors";
import type { WalletAdapter } from "@/lib/wallet/WalletAdapter";

/**
 * LOCAL DEMO wallet stub — not a Midnight / 1AM integration.
 * Enabled only when NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true.
 * Address is ephemeral UI state; never a seed or private key.
 */
export class LocalDemoWalletAdapter implements WalletAdapter {
  readonly kind = "local-demo" as const;

  private address: string | null = null;

  async connect(_networkId?: string): Promise<string> {
    this.address = `demo_wallet_${Math.random().toString(16).slice(2, 10)}`;
    return this.address;
  }

  async disconnect(): Promise<void> {
    this.address = null;
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.address !== null;
  }

  async signAndSubmit(_payload: unknown): Promise<string> {
    if (!this.address) {
      throw new WalletAdapterError(WALLET_NOT_CONNECTED, WALLET_NOT_CONNECTED);
    }
    return `demo_tx_${Date.now().toString(36)}`;
  }
}
