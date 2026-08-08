"use client";

import { Badge, Button, Card, SectionHeader, Spinner } from "@/components/ui";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n } from "@/i18n";
import { truncateAddress } from "@/lib/format";

export function WalletPanel() {
  const { t } = useI18n();
  const {
    walletStatus,
    availableWallets,
    walletName,
    walletAddress,
    walletConnected,
    networkId,
    isConnecting,
    connect,
    disconnect,
    recheckWallets,
  } = useWallet();

  const statusLabel = walletConnected
    ? t("wallet.connected")
    : walletStatus === "checking"
      ? t("wallet.checking")
      : walletStatus === "detected"
        ? t("wallet.detected")
        : t("wallet.notFound");

  return (
    <Card>
      <SectionHeader
        title={t("wallet.title")}
        subtitle={t("wallet.subtitleReal")}
        action={
          <Badge
            tone={
              walletConnected
                ? "success"
                : walletStatus === "not-found"
                  ? "warning"
                  : "neutral"
            }
          >
            {statusLabel}
          </Badge>
        }
      />

      {walletConnected && walletAddress ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t("wallet.unshieldedAddress")}
            </p>
            <p className="break-all font-mono text-sm text-white">
              {walletAddress}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>
              {t("wallet.network")}:{" "}
              <span className="text-slate-200">{networkId ?? "—"}</span>
            </span>
            <span aria-hidden>·</span>
            <span>{walletName ?? t("wallet.adapterConnector")}</span>
          </div>
          <Button variant="secondary" onClick={() => void disconnect()}>
            {t("wallet.disconnect")}
          </Button>
        </div>
      ) : walletStatus === "checking" ? (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner />
          {t("wallet.checking")}
        </p>
      ) : walletStatus === "not-found" ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">{t("wallet.install")}</p>
          <Button variant="secondary" onClick={recheckWallets}>
            {t("wallet.checkAgain")}
          </Button>
        </div>
      ) : availableWallets.length > 1 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("wallet.pick")}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableWallets.map((name) => (
              <Button
                key={name}
                variant="secondary"
                disabled={isConnecting}
                onClick={() => void connect(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Button
          disabled={isConnecting}
          onClick={() => void connect(availableWallets[0])}
        >
          {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
        </Button>
      )}
    </Card>
  );
}

/** Inline nudge for views that need a session before they can do anything. */
export function WalletRequired() {
  const { t } = useI18n();
  const { walletConnected, walletStatus, connect, isConnecting, recheckWallets } =
    useWallet();
  if (walletConnected) return null;

  const missing = walletStatus === "not-found";

  return (
    <div
      className={
        missing
          ? "flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3"
          : "flex flex-wrap items-center gap-3 rounded-xl border border-cyan-400/25 bg-cyan-400/5 px-4 py-3"
      }
    >
      <p
        className={
          missing
            ? "min-w-0 flex-1 text-sm text-amber-100"
            : "min-w-0 flex-1 text-sm text-cyan-100"
        }
      >
        {missing ? t("wallet.install") : t("wallet.required")}
      </p>
      {missing ? (
        <Button variant="secondary" onClick={recheckWallets}>
          {t("wallet.checkAgain")}
        </Button>
      ) : (
        <Button disabled={isConnecting} onClick={() => void connect()}>
          {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
        </Button>
      )}
    </div>
  );
}

export function ContractBadge() {
  const { t } = useI18n();
  const { contractAddress } = useWallet();

  return (
    <Badge tone={contractAddress ? "info" : "warning"}>
      {contractAddress
        ? truncateAddress(contractAddress, 10, 6)
        : t("contract.notDeployed")}
    </Badge>
  );
}
