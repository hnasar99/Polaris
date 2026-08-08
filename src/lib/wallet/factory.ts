import { MidnightDappConnectorAdapter } from "@/lib/wallet/MidnightDappConnectorAdapter";
import type { WalletAdapter } from "@/lib/wallet/WalletAdapter";

/**
 * The real window.midnight connect flow. It throws clearly when the extension
 * is missing or submit is not wired, rather than simulating a connection.
 *
 * UnconnectedWalletAdapter remains available for tests and explicit stubs.
 * Session / Compact WASM load only inside MidnightDappConnectorAdapter.connect().
 */
export function createWalletAdapter(): WalletAdapter {
  return new MidnightDappConnectorAdapter();
}
