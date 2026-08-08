"use client";

import { useWallet } from "@/features/wallet/WalletProvider";

/** Platform wallet + contract must be ready before lab on-chain publish/close. */
export function usePlatformSessionReady(): boolean {
  const { contractAddress, walletConnected, bindingsReady } = useWallet();
  return bindingsReady && Boolean(contractAddress) && walletConnected;
}
