"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { createMidnightProtocol, sanitizeError } from "@/lib/midnight";
import type { MidnightHealthProtocol } from "@/lib/midnight";
import {
  createWalletAdapter,
  detectInjectedWallets,
  getMidnightNetworkId,
  listWallets,
  WALLET_CONNECT_TIMEOUT,
  WALLET_LOCKED,
  type WalletAdapter,
  type WalletAdapterKind,
  type WalletDetectionStatus,
} from "@/lib/wallet";

export type AppError = { code: string; message: string };

/** Remembers which extension was last authorized so role changes keep the session. */
const WALLET_NAME_KEY = "polaris:wallet-name";

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
  /** Stop waiting on an extension that never answered, without a page reload. */
  cancelConnect: () => void;
  disconnect: () => Promise<void>;
  /** Re-run extension detection, for the "check again" affordance. */
  recheckWallets: () => void;

  contractAddress: string | null;
  isDeploying: boolean;
  deploy: () => Promise<void>;
  setContractAddress: (address: string) => void;
  forgetContractAddress: () => void;

  /** Unshielded NIGHT in the connected wallet (null until fetched). */
  unshieldedBalanceNight: number | null;
  refreshWalletBalance: () => Promise<void>;
  /** Set after deploy — VaultPanel should prompt to fund. */
  requestVaultFund: boolean;
  clearFundPrompt: () => void;

  error: AppError | null;
  setError: (error: AppError | null) => void;
  reportError: (error: unknown) => AppError;
};

const WalletContext = createContext<WalletValue | null>(null);

function readPersistedWalletName(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(WALLET_NAME_KEY);
  return value && value.length > 0 ? value : null;
}

function persistWalletName(name: string | null): void {
  if (typeof window === "undefined") return;
  if (name) window.localStorage.setItem(WALLET_NAME_KEY, name);
  else window.localStorage.removeItem(WALLET_NAME_KEY);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
  const connectingRef = useRef(false);
  const restoreAttemptedRef = useRef(false);
  /** Bumped per attempt; a stale attempt that finally answers is ignored. */
  const attemptRef = useRef(0);
  /** Wallet to retry once the tab regains focus, after a locked failure. */
  const unlockRetryRef = useRef<{ walletName?: string } | null>(null);
  const autoRetryRef = useRef(false);

  const [contractAddress, setContractAddressState] = useState<string | null>(
    null,
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [unshieldedBalanceNight, setUnshieldedBalanceNight] = useState<
    number | null
  >(null);
  const [requestVaultFund, setRequestVaultFund] = useState(false);

  const refreshWalletBalance = useCallback(async () => {
    if (!wallet.getUnshieldedBalanceNight || !wallet.isConnected()) {
      setUnshieldedBalanceNight(null);
      return;
    }
    try {
      const balance = await wallet.getUnshieldedBalanceNight();
      setUnshieldedBalanceNight(balance);
    } catch (raw) {
      console.error("[polaris] wallet balance", raw);
      setUnshieldedBalanceNight(null);
    }
  }, [wallet]);

  const clearFundPrompt = useCallback(() => {
    setRequestVaultFund(false);
  }, []);

  // The extension injects asynchronously, so detection polls rather than
  // reading window.midnight once.
  useEffect(() => {
    let cancelled = false;
    void detectInjectedWallets().then(({ status, wallets }) => {
      if (cancelled) return;
      setWalletStatus(status);
      setAvailableWallets(wallets.map((w) => w.name));
    });
    return () => {
      cancelled = true;
    };
  }, [detectionRun]);

  const recheckWallets = useCallback(() => {
    setWalletStatus("checking");
    restoreAttemptedRef.current = false;
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
    // Raw cause stays in the console for operators; the banner only shows codes.
    console.error("[polaris]", sanitized.code, raw);
    setError(sanitized);
    return sanitized;
  }, []);

  const connect = useCallback(
    async (name?: string) => {
      // Clicking again supersedes the previous attempt instead of being
      // swallowed by an "already connecting" guard: a locked extension can
      // leave the first attempt pending, and that used to wedge the button.
      const attempt = attemptRef.current + 1;
      attemptRef.current = attempt;
      const isCurrent = () => attemptRef.current === attempt;
      unlockRetryRef.current = null;
      connectingRef.current = true;
      setIsConnecting(true);
      const preferred =
        name ?? walletName ?? readPersistedWalletName() ?? undefined;
      try {
        const address = await wallet.connect(
          getMidnightNetworkId(),
          preferred,
        );
        if (!isCurrent()) return;
        const resolvedName = wallet.getWalletName?.() ?? preferred ?? null;
        setWalletAddress(address);
        setWalletName(resolvedName);
        setNetworkId(wallet.getNetworkId?.() ?? getMidnightNetworkId());
        setWalletStatus("detected");
        setAvailableWallets(listWallets().map((w) => w.name));
        persistWalletName(resolvedName);
        setError(null);
        const { loadPersistedContractAddress } = await import(
          "@/lib/midnight/runtime"
        );
        setContractAddressState(loadPersistedContractAddress());
        await refreshWalletBalance();
      } catch (raw) {
        if (!isCurrent()) return;
        const reported = reportError(raw);
        // The user fixes a locked wallet outside the page, so pick the attempt
        // back up when they return — but only once per manual attempt.
        if (
          !autoRetryRef.current &&
          (reported.code === WALLET_LOCKED ||
            reported.code === WALLET_CONNECT_TIMEOUT)
        ) {
          unlockRetryRef.current = { walletName: preferred };
        }
      } finally {
        if (isCurrent()) {
          connectingRef.current = false;
          setIsConnecting(false);
        }
      }
    },
    [reportError, refreshWalletBalance, wallet, walletName],
  );

  const cancelConnect = useCallback(() => {
    attemptRef.current += 1;
    unlockRetryRef.current = null;
    connectingRef.current = false;
    setIsConnecting(false);
  }, []);

  // Unlocking happens in the extension, which takes focus away from the tab.
  useEffect(() => {
    const resume = () => {
      const pending = unlockRetryRef.current;
      if (!pending) return;
      if (document.visibilityState !== "visible") return;
      if (walletAddress || connectingRef.current) return;
      unlockRetryRef.current = null;
      autoRetryRef.current = true;
      void connect(pending.walletName).finally(() => {
        autoRetryRef.current = false;
      });
    };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [connect, walletAddress]);

  // Re-authorize silently after role navigation / reload — but never on the
  // landing page. connect() loads session.ts → compact-runtime / ledger WASM.
  useEffect(() => {
    if (pathname === "/") {
      restoreAttemptedRef.current = false;
      return;
    }
    if (walletStatus !== "detected") return;
    if (walletAddress || connectingRef.current) return;
    if (restoreAttemptedRef.current) return;
    const saved = readPersistedWalletName();
    if (!saved) return;
    // Prefer an exact injected match; fall back to first available wallet.
    const names = listWallets().map((w) => w.name);
    const target =
      names.find((n) => n.toLowerCase() === saved.toLowerCase()) ?? names[0];
    if (!target) return;
    restoreAttemptedRef.current = true;
    void connect(target);
  }, [connect, pathname, walletAddress, walletStatus]);

  const disconnect = useCallback(async () => {
    attemptRef.current += 1;
    unlockRetryRef.current = null;
    connectingRef.current = false;
    setIsConnecting(false);
    await wallet.disconnect();
    setWalletAddress(null);
    setWalletName(null);
    setNetworkId(null);
    setUnshieldedBalanceNight(null);
    persistWalletName(null);
    restoreAttemptedRef.current = true; // do not auto-reconnect after an explicit sign-out
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
      // Keep Compact/session WASM out of the eager WalletProvider graph.
      const { deployPolarisContract } = await import("@/lib/midnight/factory");
      const address = await deployPolarisContract();
      setContractAddressState(address);
      setRequestVaultFund(true);
      setError(null);
      await refreshWalletBalance();
    } catch (raw) {
      reportError(raw);
    } finally {
      setIsDeploying(false);
    }
  }, [refreshWalletBalance, reportError]);

  const value = useMemo<WalletValue>(
    () => ({
      bindingsReady,
      protocol,
      walletKind: wallet.kind,
      walletStatus,
      availableWallets,
      walletName,
      walletAddress,
      // Trust React state as source of truth for the UI; the adapter is kept in
      // sync by connect/disconnect and rolls back on failed attempts.
      walletConnected: Boolean(walletAddress),
      networkId,
      isConnecting,
      connect,
      cancelConnect,
      disconnect,
      recheckWallets,
      contractAddress,
      isDeploying,
      deploy,
      setContractAddress,
      forgetContractAddress,
      unshieldedBalanceNight,
      refreshWalletBalance,
      requestVaultFund,
      clearFundPrompt,
      error,
      setError,
      reportError,
    }),
    [
      availableWallets,
      bindingsReady,
      cancelConnect,
      clearFundPrompt,
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
      refreshWalletBalance,
      reportError,
      requestVaultFund,
      setContractAddress,
      unshieldedBalanceNight,
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
