import { LocalDemoWalletAdapter } from "@/lib/wallet/LocalDemoWalletAdapter";
import { MidnightDappConnectorAdapter } from "@/lib/wallet/MidnightDappConnectorAdapter";
import type { WalletAdapter } from "@/lib/wallet/WalletAdapter";
import { isDemoMidnightEnabled } from "@/lib/midnight/factory";

/**
 * Demo Midnight → clearly labeled LocalDemoWalletAdapter.
 * Default → MidnightDappConnectorAdapter (real window.midnight connect flow;
 * throws clearly if extension missing / submit not wired).
 *
 * UnconnectedWalletAdapter remains available for tests and explicit stubs.
 */
export function createWalletAdapter(): WalletAdapter {
  if (isDemoMidnightEnabled()) {
    return new LocalDemoWalletAdapter();
  }
  return new MidnightDappConnectorAdapter();
}

export function getMidnightNetworkId(): string {
  return process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK ?? "preprod";
}
