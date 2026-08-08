/**
 * Wallet surface for the app. Heavy DApp Connector + session wiring is not
 * re-exported here so the eager client graph stays free of Compact WASM.
 */

export type {
  WalletAdapter,
  WalletAdapterKind,
} from "@/lib/wallet/WalletAdapter";
export type {
  MidnightConnectedAPI,
  MidnightInitialAPI,
  MidnightNetworkId,
} from "@/lib/wallet/dapp-connector-types";
export type { WalletDetectionStatus } from "@/lib/wallet/selectWallet";
export { UnconnectedWalletAdapter } from "@/lib/wallet/UnconnectedWalletAdapter";
export {
  createWalletAdapter,
  getMidnightNetworkId,
} from "@/lib/wallet/factory";
export {
  listWallets,
  selectWallet,
  detectInjectedWallets,
} from "@/lib/wallet/selectWallet";
export { readUnshieldedBalanceNight } from "@/lib/wallet/balances";
export {
  WalletAdapterError,
  classifyWalletConnectFailure,
  WALLET_NOT_CONNECTED,
  WALLET_EXTENSION_MISSING,
  WALLET_SUBMIT_NOT_WIRED,
  WALLET_CONNECT_REJECTED,
  WALLET_CONNECT_TIMEOUT,
  WALLET_LOCKED,
  WALLET_NETWORK_MISMATCH,
  WALLET_SESSION_FAILED,
  WALLET_SSR,
} from "@/lib/wallet/errors";
