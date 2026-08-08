import type { MidnightInitialAPI } from "@/lib/wallet/dapp-connector-types";
import {
  WALLET_EXTENSION_MISSING,
  WalletAdapterError,
} from "@/lib/wallet/errors";

/**
 * List wallets injected on `window.midnight`.
 * Keys are typically UUIDs — always use Object.values, never hardcode lace keys.
 */
export function listWallets(): MidnightInitialAPI[] {
  if (typeof window === "undefined") {
    return [];
  }
  const injected = window.midnight;
  if (!injected) {
    return [];
  }
  return Object.values(injected).filter(isInitialApi);
}

function isInitialApi(value: unknown): value is MidnightInitialAPI {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as MidnightInitialAPI).connect === "function" &&
    typeof (value as MidnightInitialAPI).name === "string"
  );
}

/**
 * Prefer a wallet named 1AM when multiple are present; otherwise first injected API.
 * Callers with a picker should use listWallets() instead.
 */
export function selectWallet(preferredName?: string): MidnightInitialAPI {
  const wallets = listWallets();
  if (wallets.length === 0) {
    throw new WalletAdapterError(
      "WALLET_EXTENSION_MISSING",
      WALLET_EXTENSION_MISSING,
    );
  }
  if (preferredName) {
    const requested = wallets.find(
      (w) => w.name.toLowerCase() === preferredName.toLowerCase(),
    );
    if (requested) return requested;
  }
  const oneAm = wallets.find(
    (w) => w.name === "1AM" || w.name.toLowerCase() === "1am",
  );
  return oneAm ?? wallets[0]!;
}

export type WalletDetectionStatus = "checking" | "detected" | "not-found";

/**
 * Poll for async extension injection (1am-wallet guidance).
 * Resolves when at least one wallet appears or timeout elapses.
 */
export function detectInjectedWallets(
  timeoutMs = 6000,
  intervalMs = 300,
): Promise<{ status: Exclude<WalletDetectionStatus, "checking">; wallets: MidnightInitialAPI[] }> {
  if (typeof window === "undefined") {
    return Promise.resolve({ status: "not-found", wallets: [] });
  }

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      const wallets = listWallets();
      if (wallets.length > 0) {
        resolve({ status: "detected", wallets });
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve({ status: "not-found", wallets: [] });
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}
