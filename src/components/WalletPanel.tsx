"use client";

import { Badge, Button, Card, SectionHeader, Spinner } from "@/components/ui";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n } from "@/i18n";
import { truncateAddress } from "@/lib/format";

/**
 * Funds live on one network at a time, so the network is a user choice rather
 * than a build-time constant. Switching reopens the session on the new network.
 */
function NetworkSwitch() {
  const { t } = useI18n();
  const { availableNetworks, selectedNetwork, setNetwork, isConnecting } =
    useWallet();

  if (availableNetworks.length < 2) return null;

  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {t("wallet.networkPick")}
      </p>
      <div
        role="group"
        aria-label={t("wallet.networkPick")}
        className="flex flex-wrap gap-2"
      >
        {availableNetworks.map((network) => (
          <Button
            key={network}
            variant={network === selectedNetwork ? "primary" : "secondary"}
            aria-pressed={network === selectedNetwork}
            disabled={isConnecting}
            onClick={() => void setNetwork(network)}
          >
            {network}
          </Button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{t("wallet.networkHint")}</p>
    </div>
  );
}

export function WalletPanel() {
  const { t, formatNumber } = useI18n();
  const {
    walletStatus,
    availableWallets,
    walletName,
    walletAddress,
    walletConnected,
    networkId,
    unshieldedBalanceNight,
    isConnecting,
    connect,
    cancelConnect,
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

      <NetworkSwitch />

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
          {unshieldedBalanceNight !== null ? (
            <p className="text-xs text-slate-400">
              {t("admin.walletBalance", {
                amount: formatNumber(unshieldedBalanceNight, {
                  maximumFractionDigits: 6,
                }),
              })}
            </p>
          ) : null}
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
      ) : isConnecting ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-slate-300">
            <Spinner />
            {t("wallet.connecting")}
          </p>
          <p className="text-xs text-slate-400">{t("wallet.approveHint")}</p>
          <Button variant="secondary" onClick={cancelConnect}>
            {t("common.cancel")}
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
                onClick={() => void connect(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Button onClick={() => void connect(availableWallets[0])}>
          {t("wallet.connect")}
        </Button>
      )}
    </Card>
  );
}

/** Inline nudge for views that need a session before they can do anything. */
export function WalletRequired() {
  const { t } = useI18n();
  const {
    walletConnected,
    walletStatus,
    availableWallets,
    connect,
    cancelConnect,
    isConnecting,
    recheckWallets,
  } = useWallet();
  if (walletConnected) return null;

  const missing = walletStatus === "not-found";
  const checking = walletStatus === "checking";

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
        {missing
          ? t("wallet.install")
          : checking
            ? t("wallet.checking")
            : isConnecting
              ? t("wallet.approveHint")
              : t("wallet.patientRequired")}
      </p>
      {missing ? (
        <Button variant="secondary" onClick={recheckWallets}>
          {t("wallet.checkAgain")}
        </Button>
      ) : checking ? (
        <Spinner />
      ) : isConnecting ? (
        <div className="flex items-center gap-2">
          <Spinner />
          <Button variant="secondary" onClick={cancelConnect}>
            {t("common.cancel")}
          </Button>
        </div>
      ) : availableWallets.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {availableWallets.map((name) => (
            <Button
              key={name}
              variant="secondary"
              onClick={() => void connect(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      ) : (
        <Button
          disabled={availableWallets.length === 0}
          onClick={() => void connect(availableWallets[0])}
        >
          {availableWallets[0]
            ? `${t("wallet.connect")} · ${availableWallets[0]}`
            : t("wallet.connect")}
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
