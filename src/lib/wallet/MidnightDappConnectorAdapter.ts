import type { MidnightNetworkId } from "@/lib/wallet/dapp-connector-types";
import type { MidnightConnectedAPI } from "@/lib/wallet/dapp-connector-types";
import {
  WALLET_CONNECT_REJECTED,
  WALLET_NOT_CONNECTED,
  WALLET_SSR,
  WALLET_SUBMIT_NOT_WIRED,
  WalletAdapterError,
  classifyWalletConnectFailure,
} from "@/lib/wallet/errors";
import { readUnshieldedBalanceNight } from "@/lib/wallet/balances";
import { selectWallet } from "@/lib/wallet/selectWallet";
import type { WalletAdapter } from "@/lib/wallet/WalletAdapter";
import { POLARIS_ZK_ASSET_PATH } from "@/lib/midnight/constants";

const DEFAULT_NETWORK: MidnightNetworkId = "preprod";

/** Opaque session handle — concrete type lives in session.ts (WASM-heavy). */
export type WalletSessionHandle = {
  unshieldedAddress: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wallet configuration blob
  config?: any;
};

/**
 * Typed Midnight DApp Connector adapter (1AM / Lace / any InitialAPI on window.midnight).
 *
 * Connect flow:
 * 1. selectWallet() via Object.values(window.midnight)
 * 2. initialApi.connect(networkId) → ConnectedAPI
 * 3. createConnectedSession (prove / balance / submit providers)
 *
 * Protocol circuit calls go through MidnightAdapter (not signAndSubmit).
 * Session / Compact modules are loaded only on connect().
 */
export class MidnightDappConnectorAdapter implements WalletAdapter {
  readonly kind = "dapp-connector" as const;

  private address: string | null = null;
  private connectedApi: MidnightConnectedAPI | null = null;
  private session: WalletSessionHandle | null = null;
  private networkId: MidnightNetworkId | string = DEFAULT_NETWORK;
  private walletName: string | null = null;

  async connect(
    networkId: MidnightNetworkId | string = DEFAULT_NETWORK,
    walletName?: string,
  ): Promise<string> {
    if (typeof window === "undefined") {
      throw new WalletAdapterError(
        WALLET_SSR,
        "Midnight wallet connect requires a browser environment.",
      );
    }

    // Clear any half-open state from a previous failed attempt so a retry
    // always starts from the InitialAPI (and can re-prompt the extension).
    this.resetLocal();
    this.networkId = networkId;

    try {
      const wallet = selectWallet(walletName);
      this.walletName = wallet.name;

      const api = await wallet.connect(networkId);
      const { unshieldedAddress } = await api.getUnshieldedAddress();

      if (typeof api.getConnectionStatus === "function") {
        const status = await api.getConnectionStatus();
        if (status.status !== "connected") {
          throw new WalletAdapterError(WALLET_CONNECT_REJECTED);
        }
      }

      this.connectedApi = api;
      this.address = unshieldedAddress;

      const [{ createConnectedSession }, runtime, { getOrCreateDappSecret }] =
        await Promise.all([
          import("@/lib/midnight/session"),
          import("@/lib/midnight/runtime"),
          import("@/lib/midnight/secret"),
        ]);

      const session = await createConnectedSession(api, POLARIS_ZK_ASSET_PATH);
      this.session = session;
      this.networkId = session.config?.networkId ?? networkId;
      runtime.setMidnightSession(session);
      runtime.setMidnightDappSecret(getOrCreateDappSecret());
      runtime.loadPersistedContractAddress();

      return unshieldedAddress;
    } catch (error) {
      this.resetLocal();
      const { clearMidnightRuntime } = await import("@/lib/midnight/runtime");
      clearMidnightRuntime();
      throw classifyWalletConnectFailure(error);
    }
  }

  private resetLocal(): void {
    this.address = null;
    this.connectedApi = null;
    this.session = null;
    this.walletName = null;
  }

  async disconnect(): Promise<void> {
    this.resetLocal();
    this.networkId = DEFAULT_NETWORK;
    const { clearMidnightRuntime } = await import("@/lib/midnight/runtime");
    clearMidnightRuntime();
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.address !== null && this.connectedApi !== null;
  }

  getConnectedApi(): MidnightConnectedAPI | null {
    return this.connectedApi;
  }

  getSession(): WalletSessionHandle | null {
    return this.session;
  }

  getNetworkId(): string {
    return String(this.networkId);
  }

  getWalletName(): string | null {
    return this.walletName;
  }

  async getUnshieldedBalanceNight(): Promise<number | null> {
    if (!this.connectedApi) return null;
    return readUnshieldedBalanceNight(this.connectedApi);
  }

  /**
   * Circuit submits are handled by MidnightAdapter.callPolarisCircuit.
   * Keep this method for WalletAdapter compatibility — do not fake ZK success.
   */
  async signAndSubmit(_payload: unknown): Promise<string> {
    if (!this.isConnected()) {
      throw new WalletAdapterError(WALLET_NOT_CONNECTED);
    }
    throw new WalletAdapterError(WALLET_SUBMIT_NOT_WIRED);
  }
}
