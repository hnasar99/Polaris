import type { MidnightNetworkId } from "@/lib/wallet/dapp-connector-types";

export type WalletAdapterKind = "unconnected" | "dapp-connector";

/**
 * Wallet connectivity boundary for the Midnight ecosystem.
 *
 * Production path: MidnightDappConnectorAdapter (DApp Connector / window.midnight).
 * Pure stub: UnconnectedWalletAdapter.
 */
export interface WalletAdapter {
  readonly kind: WalletAdapterKind;
  /** walletName picks a specific injected wallet; defaults to 1AM when present. */
  connect(
    networkId?: MidnightNetworkId | string,
    walletName?: string,
  ): Promise<string>;
  disconnect(): Promise<void>;
  getAddress(): string | null;
  isConnected(): boolean;
  /** Network the session was opened against, once connected. */
  getNetworkId?(): string;
  /** Name of the injected wallet in use (e.g. "1AM"). */
  getWalletName?(): string | null;
  /** Unshielded NIGHT available in the connected wallet, if the extension exposes balances. */
  getUnshieldedBalanceNight?(): Promise<number | null>;
  /** Must throw rather than fabricate a transaction id. */
  signAndSubmit(payload: unknown): Promise<string>;
}
