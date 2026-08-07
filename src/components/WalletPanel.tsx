"use client";

import { useAppState } from "@/features/app/AppStateProvider";

export function WalletPanel() {
  const {
    walletConnected,
    walletAddress,
    walletStatus,
    walletKind,
    isConnecting,
    connectWallet,
    disconnectWallet,
    demoMode,
    globalError,
  } = useAppState();

  const walletError =
    globalError &&
    (globalError.code.startsWith("WALLET_") ||
      globalError.code === "WALLET_NOT_CONNECTED")
      ? globalError
      : null;

  const adapterLabel =
    walletKind === "local-demo"
      ? "Local demo stub (not 1AM)"
      : walletKind === "dapp-connector"
        ? "Midnight DApp Connector (window.midnight)"
        : "Unconnected stub";

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0b1628] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300/90">
        Wallet
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        {adapterLabel}
        {demoMode
          ? " — DEMO mode; addresses are ephemeral UI state."
          : " — connect via injected Midnight wallet extension."}
      </p>

      <div className="mt-3 text-xs font-mono uppercase tracking-wider text-slate-500">
        Status:{" "}
        <span className="text-slate-300">
          {walletConnected
            ? "Connected"
            : walletStatus === "checking"
              ? "Checking wallet…"
              : walletStatus === "detected"
                ? "Detected — not connected"
                : demoMode
                  ? "Ready (demo)"
                  : "Extension not found"}
        </span>
      </div>

      {walletError && (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {walletError.message}
        </p>
      )}

      {walletConnected && walletAddress ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Unshielded address
            </p>
            <code
              className="mt-1 block max-w-full truncate rounded bg-black/30 px-2 py-1 text-xs text-cyan-100"
              title={walletAddress}
            >
              {walletAddress}
            </code>
          </div>
          <button
            type="button"
            onClick={() => void disconnectWallet()}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void connectWallet()}
            disabled={isConnecting || (!demoMode && walletStatus === "checking")}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041018] hover:bg-cyan-400 disabled:opacity-40"
          >
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
          {!demoMode && walletStatus === "not-found" && (
            <p className="text-xs text-slate-500">
              Install a Midnight wallet extension (e.g. 1AM), unlock it, then
              refresh. Wallets inject under{" "}
              <code className="text-slate-400">window.midnight</code> (UUID
              keys — enumerated via Object.values).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
