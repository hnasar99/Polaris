"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Spinner } from "@/components/ui";
import { useChain } from "@/features/chain/ChainProvider";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n } from "@/i18n";
import { listAdminContracts } from "@/lib/midnight/admin-identity";
import type { VaultStatus } from "@/types/midnight";

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function formatDeployedAt(
  deployedAt: string,
  unknownLabel: string,
): string {
  if (!deployedAt) return unknownLabel;
  const parsed = Date.parse(deployedAt);
  if (!Number.isFinite(parsed)) return unknownLabel;
  return new Date(parsed).toLocaleString();
}

export function DeploymentHistory() {
  const { t, formatNumber } = useI18n();
  const {
    contractAddress,
    setContractAddress,
    networkId,
    walletConnected,
  } = useWallet();
  const {
    busyKey,
    readVaultForAddress,
    rolloverVault,
    rolloverAllVaults,
    refresh,
  } = useChain();
  const [vaultByAddress, setVaultByAddress] = useState<
    Record<string, VaultStatus>
  >({});
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const records = useMemo(
    () => listAdminContracts(),
    [contractAddress, networkId, refreshToken],
  );

  const visible = useMemo(() => {
    if (!networkId) return records;
    return records.filter((row) => row.networkId === networkId);
  }, [networkId, records]);

  useEffect(() => {
    if (!walletConnected || visible.length === 0) {
      setVaultByAddress({});
      return;
    }

    let cancelled = false;
    void (async () => {
      setBalancesLoading(true);
      try {
        const entries = await Promise.all(
          visible.map(async (row) => {
            const vault = await readVaultForAddress(row.address);
            return [row.address, vault] as const;
          }),
        );
        if (!cancelled) {
          setVaultByAddress(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) setBalancesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, walletConnected, readVaultForAddress, busyKey, refreshToken]);

  const rolloverSources = useMemo(() => {
    if (!contractAddress) return [];
    return visible.filter((row) => {
      if (row.address === contractAddress) return false;
      const vault = vaultByAddress[row.address];
      return vault?.known && vault.isAdmin && vault.balanceNight > 0;
    });
  }, [contractAddress, vaultByAddress, visible]);

  const handleCopy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Clipboard may be unavailable outside secure context.
    }
  };

  const handleRolloverOne = async (sourceAddress: string, amountNight: number) => {
    if (
      !window.confirm(
        t("admin.rolloverConfirmOne", {
          source: truncateAddress(sourceAddress),
          target: contractAddress ? truncateAddress(contractAddress) : "—",
          amount: formatNumber(amountNight),
        }),
      )
    ) {
      return;
    }

    const result = await rolloverVault(sourceAddress);
    if (result?.moved) {
      await refresh();
      setRefreshToken((value) => value + 1);
    }
  };

  const handleRolloverAll = async () => {
    if (!contractAddress || rolloverSources.length === 0) return;

    const totalNight = rolloverSources.reduce((sum, row) => {
      const vault = vaultByAddress[row.address];
      return sum + (vault?.balanceNight ?? 0);
    }, 0);

    if (
      !window.confirm(
        t("admin.rolloverConfirmAll", {
          count: rolloverSources.length,
          target: truncateAddress(contractAddress),
          amount: formatNumber(totalNight),
        }),
      )
    ) {
      return;
    }

    await rolloverAllVaults();
    await refresh();
    setRefreshToken((value) => value + 1);
  };

  const rolling =
    busyKey?.startsWith("rollover:") ?? false;

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {t("admin.historyTitle")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t("admin.historyBody")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("admin.rolloverHint")}</p>
        </div>

        {contractAddress && rolloverSources.length > 0 ? (
          <Button
            variant="secondary"
            disabled={rolling || !walletConnected}
            onClick={() => void handleRolloverAll()}
          >
            {rolling && busyKey === "rollover:all" ? (
              <>
                <Spinner /> {t("admin.rolloverAllRunning")}
              </>
            ) : (
              t("admin.rolloverAll", { count: rolloverSources.length })
            )}
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400">{t("admin.historyEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => {
            const isActive = row.address === contractAddress;
            const vault = vaultByAddress[row.address];
            const canRollover =
              !isActive &&
              contractAddress &&
              vault?.known &&
              vault.isAdmin &&
              vault.balanceNight > 0;
            const rowBusy = busyKey === `rollover:${row.address}`;

            return (
              <li
                key={`${row.networkId}:${row.address}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="font-mono text-sm text-white"
                        title={row.address}
                      >
                        {truncateAddress(row.address)}
                      </p>
                      {isActive ? (
                        <Badge tone="success">{t("admin.historyActive")}</Badge>
                      ) : null}
                      <Badge tone="neutral">
                        {row.source === "deploy"
                          ? t("admin.historySourceDeploy")
                          : t("admin.historySourceJoin")}
                      </Badge>
                      {row.networkId !== networkId ? (
                        <Badge tone="info">{row.networkId}</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDeployedAt(
                        row.deployedAt,
                        t("admin.historyUnknownDate"),
                      )}
                    </p>
                    {balancesLoading && !vault ? (
                      <p className="text-xs text-slate-500">
                        {t("admin.historyBalanceLoading")}
                      </p>
                    ) : vault?.known ? (
                      <p className="text-xs text-slate-400">
                        {t("admin.historyVaultBalance", {
                          amount: formatNumber(vault.balanceNight),
                        })}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => void handleCopy(row.address)}
                    >
                      {t("admin.historyCopy")}
                    </Button>
                    {!isActive ? (
                      <Button
                        variant="secondary"
                        onClick={() => setContractAddress(row.address)}
                      >
                        {t("admin.historyUse")}
                      </Button>
                    ) : null}
                    {canRollover ? (
                      <Button
                        disabled={rolling || !walletConnected}
                        onClick={() =>
                          void handleRolloverOne(row.address, vault.balanceNight)
                        }
                      >
                        {rowBusy ? (
                          <>
                            <Spinner /> {t("admin.rolloverRunning")}
                          </>
                        ) : (
                          t("admin.rolloverOne")
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
