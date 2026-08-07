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
export { LocalDemoWalletAdapter } from "@/lib/wallet/LocalDemoWalletAdapter";
export { MidnightDappConnectorAdapter } from "@/lib/wallet/MidnightDappConnectorAdapter";
export {
  createWalletAdapter,
  getMidnightNetworkId,
} from "@/lib/wallet/factory";
export {
  listWallets,
  selectWallet,
  detectInjectedWallets,
} from "@/lib/wallet/selectWallet";
export {
  WalletAdapterError,
  WALLET_NOT_CONNECTED,
  WALLET_EXTENSION_MISSING,
  WALLET_SUBMIT_NOT_WIRED,
} from "@/lib/wallet/errors";
