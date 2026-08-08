"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createMidnightProtocol, sanitizeError } from "@/lib/midnight";
import type { MidnightHealthProtocol } from "@/lib/midnight";
import { deployPolarisContract } from "@/lib/midnight/factory";
import {
  createWalletAdapter,
  detectInjectedWallets,
  getMidnightNetworkId,
  listWallets,
  type WalletAdapter,
  type WalletAdapterKind,
  type WalletDetectionStatus,
} from "@/lib/wallet";

export type AppError = { code: string; message: string };

type WalletValue = {
  bindingsReady: boolean;
  protocol: MidnightHealthProtocol;

  walletKind: WalletAdapterKind;
  walletStatus: WalletDetectionStatus;
  availableWallets: string[];
  walletName: string | null;
  walletAddress: string | null;
  walletConnected: boolean;
  networkId: string | null;
  isConnecting: boolean;
  connect: (walletName?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  /** Re-run extension detection, for the "check again" affordance. */
  recheckWallets: () => void;

  contractAddress: string | null;
  isDeploying: boolean;
  deploy: () => Promise<void>;
  setContractAddress: (address: string) => void;
  forgetContractAddress: () => void;

  error: AppError | null;
  setError: (error: AppError | null) => void;
  reportError: (error: unknown) => AppError;
};

const WalletContext = createContext<WalletValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const bindingsReady =
    process.env.NEXT_PUBLIC_POLARIS_BINDINGS_READY === "true";

  const [protocol] = useState<MidnightHealthProtocol>(() =>
    createMidnightProtocol(),
  );
  const [wallet] = useState<WalletAdapter>(() => createWalletAdapter());

  const [walletStatus, setWalletStatus] =
    useState<WalletDetectionStatus>("checking");
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [detectionRun, setDetectionRun] = useState(0);

  const [contractAddress, setContractAddressState] = useState<string | null>(
    null,
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // The extension injects asynchronously, so detection polls rather than
  // reading window.midnight once.
  useEffect(() => {
    let cancelled = false;
    void detectInjectedWallets().then(({ status }) => {
      if (cancelled) return;
      setWalletStatus(status);
      setAvailableWallets(listWallets().map((w) => w.name));
    });
    return () => {
      cancelled = true;
    };
  }, [detectionRun]);

  const recheckWallets = useCallback(() => {
    setWalletStatus("checking");
    setDetectionRun((n) => n + 1);
  }, []);

  // Restore the contract address chosen on a previous visit.
  useEffect(() => {
    void import("@/lib/midnight/runtime").then(
      ({ loadPersistedContractAddress }) => {
        setContractAddressState(loadPersistedContractAddress());
      },
    );
  }, []);

  const reportError = useCallback((raw: unknown): AppError => {
    const sanitized = sanitizeError(raw);
    setError(sanitized);
    return sanitized;
  }, []);

  const connect = useCallback(
    async (name?: string) => {
      if (isConnecting) return;
      setIsConnecting(true);
      try {
        const address = await wallet.connect(getMidnightNetworkId(), name);
        setWalletAddress(address);
        setWalletName(wallet.getWalletName?.() ?? name ?? null);
        setNetworkId(wallet.getNetworkId?.() ?? getMidnightNetworkId());
        setWalletStatus("detected");
        setError(null);
        const { loadPersistedContractAddress } = await import(
          "@/lib/midnight/runtime"
        );
        setContractAddressState(loadPersistedContractAddress());
      } catch (raw) {
        reportError(raw);
      } finally {
        setIsConnecting(false);
      }
    },
    [isConnecting, reportError, wallet],
  );

  const disconnect = useCallback(async () => {
    await wallet.disconnect();
    setWalletAddress(null);
    setWalletName(null);
    setNetworkId(null);
    setError(null);
  }, [wallet]);

  const setContractAddress = useCallback((address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    setContractAddressState(trimmed);
    void import("@/lib/midnight/runtime").then(
      ({ setMidnightContractAddress }) => {
        setMidnightContractAddress(trimmed);
      },
    );
  }, []);

  const forgetContractAddress = useCallback(() => {
    setContractAddressState(null);
    window.localStorage.removeItem("polaris:contract-address");
    void import("@/lib/midnight/runtime").then(
      ({ setMidnightContractAddress }) => {
        setMidnightContractAddress(null);
      },
    );
  }, []);

  const deploy = useCallback(async () => {
    setIsDeploying(true);
    try {
      const address = await deployPolarisContract();
      setContractAddressState(address);
      setError(null);
    } catch (raw) {
      reportError(raw);
    } finally {
      setIsDeploying(false);
    }
  }, [reportError]);

  const value = useMemo<WalletValue>(
    () => ({
      bindingsReady,
      protocol,
      walletKind: wallet.kind,
      walletStatus,
      availableWallets,
      walletName,
      walletAddress,
      walletConnected: Boolean(walletAddress) && wallet.isConnected(),
      networkId,
      isConnecting,
      connect,
      disconnect,
      recheckWallets,
      contractAddress,
      isDeploying,
      deploy,
      setContractAddress,
      forgetContractAddress,
      error,
      setError,
      reportError,
    }),
    [
      availableWallets,
      bindingsReady,
      connect,
      contractAddress,
      deploy,
      disconnect,
      error,
      forgetContractAddress,
      isConnecting,
      isDeploying,
      networkId,
      protocol,
      recheckWallets,
      reportError,
      setContractAddress,
      wallet,
      walletAddress,
      walletName,
      walletStatus,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

