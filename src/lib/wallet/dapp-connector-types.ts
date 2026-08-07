/**
 * Minimal DApp Connector API types aligned with:
 * - react-wallet-connector (`@midnight-ntwrk/dapp-connector-api` patterns)
 * - 1am-wallet ConnectedAPI surface
 *
 * Local stubs only — we do not pull the full Midnight SDK tree into the Next.js
 * scaffold. When wiring for real, prefer pinning
 * `@midnight-ntwrk/dapp-connector-api@4.0.1` for official Window augmentation.
 */

export type MidnightNetworkId =
  | "undeployed"
  | "preview"
  | "preprod"
  | "mainnet";

/** Initial API injected on `window.midnight` (UUID keys and/or known ids like `1am`). */
export interface MidnightInitialAPI {
  readonly name: string;
  readonly apiVersion?: string;
  readonly icon?: string;
  connect(networkId: MidnightNetworkId | string): Promise<MidnightConnectedAPI>;
}

export interface MidnightServiceUriConfig {
  networkId: string;
  indexerUri?: string;
  indexerWsUri?: string;
  proverServerUri?: string;
  substrateNodeUri?: string;
}

export interface MidnightConnectedAPI {
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
  getConfiguration(): Promise<MidnightServiceUriConfig>;
  /** DApp Connector guide; optional on some wallet builds. */
  getConnectionStatus?(): Promise<{ status: "connected" | "disconnected" }>;
  /** Present on 1AM ConnectedAPI — used later for createConnectedSession. */
  getShieldedAddresses?(): Promise<{
    shieldedAddress: string;
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  }>;
  getProvingProvider?(zkConfigProvider: unknown): Promise<unknown>;
  balanceUnsealedTransaction?(txHex: string): Promise<{ tx: string } | null>;
  submitTransaction?(
    txHex: string,
  ): Promise<string | { transactionId?: string; id?: string } | void>;
  signData?(data: string, options?: { encoding?: string }): Promise<string>;
}

export type MidnightInjectedWallets = Record<string, MidnightInitialAPI>;

declare global {
  interface Window {
    /**
     * Wallets inject InitialAPI instances under UUID (and sometimes named) keys.
     * Enumerate with Object.values — do not hardcode lace-only keys.
     */
    midnight?: MidnightInjectedWallets;
  }
}

export {};
