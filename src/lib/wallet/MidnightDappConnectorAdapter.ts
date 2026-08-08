import type { MidnightNetworkId } from "@/lib/wallet/dapp-connector-types";
import type { MidnightConnectedAPI } from "@/lib/wallet/dapp-connector-types";
import {
  WALLET_CONNECT_REJECTED,
  WALLET_CONNECT_TIMEOUT,
  WALLET_LOCKED,
  WALLET_NOT_CONNECTED,
  WALLET_SESSION_FAILED,
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

/**
 * A locked extension answers none of these calls: 1AM keeps the request queued
 * behind its unlock screen and the promise never settles. Without a deadline
 * the caller stays "connecting" forever and every retry is swallowed, so each
 * step gets one.
 */
const APPROVAL_TIMEOUT_MS = 60_000;
const ADDRESS_TIMEOUT_MS = 30_000;
const STATUS_TIMEOUT_MS = 15_000;
const SESSION_TIMEOUT_MS = 90_000;

function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
  code: string,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    work,
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new WalletAdapterError(code, message)),
        timeoutMs,
      );
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

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

      const api = await withTimeout(
        wallet.connect(networkId),
        APPROVAL_TIMEOUT_MS,
        WALLET_CONNECT_TIMEOUT,
        `${wallet.name} never answered connect(${networkId}) — locked extension or an approval popup that was never opened.`,
      );

      // The dApp can already be authorized from a previous visit, in which case
      // connect() resolves with no popup and this is the call that blocks on the
      // unlock screen.
      const { unshieldedAddress } = await withTimeout(
        api.getUnshieldedAddress(),
        ADDRESS_TIMEOUT_MS,
        WALLET_LOCKED,
        `${wallet.name} authorized the dApp but returned no address — the wallet is locked.`,
      );

      if (typeof api.getConnectionStatus === "function") {
        // A timeout here is not fatal: the address above already proves the
        // wallet is unlocked and authorized.
        const status = await withTimeout(
          api.getConnectionStatus(),
          STATUS_TIMEOUT_MS,
          WALLET_CONNECT_TIMEOUT,
          `${wallet.name} did not report a connection status.`,
        ).catch((error: unknown) => {
          if (
            error instanceof WalletAdapterError &&
            error.code === WALLET_CONNECT_TIMEOUT
          ) {
            console.warn("[polaris] wallet getConnectionStatus timed out");
            return null;
          }
          throw error;
        });
        if (status && status.status !== "connected") {
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

      const session = await withTimeout(
        createConnectedSession(api, POLARIS_ZK_ASSET_PATH),
        SESSION_TIMEOUT_MS,
        WALLET_SESSION_FAILED,
        "Midnight session setup did not finish (wallet configuration, shielded keys or ZK assets).",
      );
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
