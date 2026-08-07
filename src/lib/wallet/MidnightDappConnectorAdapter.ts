import type { MidnightNetworkId } from "@/lib/wallet/dapp-connector-types";
import type { MidnightConnectedAPI } from "@/lib/wallet/dapp-connector-types";
import {
  WALLET_NOT_CONNECTED,
  WALLET_SUBMIT_NOT_WIRED,
  WalletAdapterError,
} from "@/lib/wallet/errors";
import { selectWallet } from "@/lib/wallet/selectWallet";
import type { WalletAdapter } from "@/lib/wallet/WalletAdapter";

const DEFAULT_NETWORK: MidnightNetworkId = "preprod";

/**
 * Typed Midnight DApp Connector adapter (1AM / Lace / any InitialAPI on window.midnight).
 *
 * Real connect flow (react-wallet-connector + 1am-wallet):
 * 1. selectWallet() via Object.values(window.midnight)
 * 2. initialApi.connect(networkId) → ConnectedAPI
 * 3. getUnshieldedAddress() + getConnectionStatus()
 *
 * signAndSubmit intentionally refuses until createConnectedSession + midnight-js
 * providers (proveTx / balanceUnsealedTransaction / submitTransaction) are wired.
 * This adapter must never fake a successful ZK submit.
 */
export class MidnightDappConnectorAdapter implements WalletAdapter {
  readonly kind = "dapp-connector" as const;

  private address: string | null = null;
  private connectedApi: MidnightConnectedAPI | null = null;
  private networkId: MidnightNetworkId | string = DEFAULT_NETWORK;

  async connect(networkId: MidnightNetworkId | string = DEFAULT_NETWORK): Promise<string> {
    if (typeof window === "undefined") {
      throw new WalletAdapterError(
        "WALLET_SSR",
        "Midnight wallet connect requires a browser environment.",
      );
    }

    this.networkId = networkId;
    const wallet = selectWallet();

    // Prompts the extension; network must match the wallet's active network.
    const api = await wallet.connect(networkId);
    const { unshieldedAddress } = await api.getUnshieldedAddress();

    if (typeof api.getConnectionStatus === "function") {
      const status = await api.getConnectionStatus();
      if (status.status !== "connected") {
        this.connectedApi = null;
        this.address = null;
        throw new WalletAdapterError(
          WALLET_NOT_CONNECTED,
          WALLET_NOT_CONNECTED,
        );
      }
    }

    this.connectedApi = api;
    this.address = unshieldedAddress;
    return unshieldedAddress;
  }

  async disconnect(): Promise<void> {
    this.address = null;
    this.connectedApi = null;
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.address !== null && this.connectedApi !== null;
  }

  /**
   * Placeholder until 1am createConnectedSession + Compact circuit submit path.
   * Holds a reference to ConnectedAPI for future provider wiring only.
   */
  getConnectedApi(): MidnightConnectedAPI | null {
    return this.connectedApi;
  }

  getNetworkId(): MidnightNetworkId | string {
    return this.networkId;
  }

  async signAndSubmit(_payload: unknown): Promise<string> {
    if (!this.isConnected()) {
      throw new WalletAdapterError(WALLET_NOT_CONNECTED, WALLET_NOT_CONNECTED);
    }
    // Do not call invent APIs or pretend ZK succeeded.
    throw new WalletAdapterError(
      "WALLET_SUBMIT_NOT_WIRED",
      WALLET_SUBMIT_NOT_WIRED,
    );
  }
}
