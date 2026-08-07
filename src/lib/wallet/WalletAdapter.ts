import type { MidnightNetworkId } from "@/lib/wallet/dapp-connector-types";

export type WalletAdapterKind =
  | "unconnected"
  | "local-demo"
  | "dapp-connector";

/**
 * Wallet connectivity boundary for the Midnight ecosystem.
 *
 * Production path: MidnightDappConnectorAdapter (DApp Connector / window.midnight).
 * Demo path: LocalDemoWalletAdapter (labeled local stub — not 1AM).
 * Pure stub: UnconnectedWalletAdapter.
 *
 * Map full prove → balance → submit via createConnectedSession in midnight/integration
 * when Compact bindings and ZK assets are available. Do not invent 1am APIs here.
 */
export interface WalletAdapter {
  readonly kind: WalletAdapterKind;
  connect(networkId?: MidnightNetworkId | string): Promise<string>;
  disconnect(): Promise<void>;
  getAddress(): string | null;
  isConnected(): boolean;
  /**
   * Demo adapters may return a local stub tx id.
   * DApp Connector adapter must throw until real 1AM session wiring exists.
   */
  signAndSubmit(payload: unknown): Promise<string>;
}
