"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshIconButton } from "@/components/RefreshIconButton";
import {
  Badge,
  Button,
  Card,
  Field,
  SectionHeader,
  Spinner,
  Stat,
  inputClass,
} from "@/components/ui";
import { nightToUsd } from "@/domain/pricing";
import { useChain } from "@/features/chain/ChainProvider";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n } from "@/i18n";

/**
 * The vault is the contract's only liquidity. Everything here is gated by
 * `assertAdmin` on-chain — the disabled state is a courtesy, not the control.
 */
export function VaultPanel() {
  const { t, formatNumber } = useI18n();
  const { vault, studies, busyKey, fundVault, withdrawVault, refresh, refreshing } =
    useChain();
  const {
    unshieldedBalanceNight,
    refreshWalletBalance,
    requestVaultFund,
    clearFundPrompt,
    walletConnected,
  } = useWallet();
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [fundDraftTouched, setFundDraftTouched] = useState(false);
  const [balancesRefreshing, setBalancesRefreshing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const funding = busyKey === "vault:fund";
  const withdrawing = busyKey === "vault:withdraw";
  const updatingBalances = balancesRefreshing || refreshing;

  /** Vault ledger + wallet unshielded — on-demand from the update control. */
  const refreshBalances = useCallback(async () => {
    setBalancesRefreshing(true);
    try {
      await Promise.all([refresh(), refreshWalletBalance()]);
      // Wallet extension balance can lag the confirmed unshielded spend briefly.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await refreshWalletBalance();
    } finally {
      setBalancesRefreshing(false);
    }
  }, [refresh, refreshWalletBalance]);

  /** Ledger is already refreshed inside fund/withdraw; re-read wallet with lag. */
  const refreshWalletAfterTx = useCallback(async () => {
    await refreshWalletBalance();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await refreshWalletBalance();
  }, [refreshWalletBalance]);

  const typicalReward =
    studies.length > 0
      ? Math.max(...studies.filter((s) => s.active).map((s) => s.rewardAmount), 0)
      : 0;
  const payoutsCovered =
    typicalReward > 0 ? Math.floor(vault.balanceNight / typicalReward) : 0;

  const empty = vault.known && vault.balanceNight <= 0;
  const low = vault.known && !empty && typicalReward > 0 && payoutsCovered < 3;

  const applyWalletBalanceDraft = () => {
    if (unshieldedBalanceNight === null || unshieldedBalanceNight <= 0) return;
    const whole = Math.floor(unshieldedBalanceNight);
    if (whole > 0) setFundAmount(String(whole));
  };

  useEffect(() => {
    if (requestVaultFund && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [requestVaultFund]);

  useEffect(() => {
    if (!walletConnected) return;
    void refreshWalletBalance();
  }, [refreshWalletBalance, walletConnected, requestVaultFund]);

  useEffect(() => {
    if (fundDraftTouched) return;
    if (!requestVaultFund && !(empty && vault.isAdmin)) return;
    applyWalletBalanceDraft();
  }, [
    empty,
    fundDraftTouched,
    requestVaultFund,
    unshieldedBalanceNight,
    vault.isAdmin,
  ]);

  return (
    <div ref={panelRef}>
    <Card>
      <SectionHeader
        title={t("admin.vaultTitle")}
        subtitle={t("admin.subtitle")}
        action={
          <div className="flex items-center gap-2">
            <RefreshIconButton
              refreshing={updatingBalances}
              onClick={refreshBalances}
            />
            <Badge tone={vault.isAdmin ? "success" : "danger"}>
              {vault.isAdmin ? t("admin.isAdmin") : t("admin.notAdmin")}
            </Badge>
          </div>
        }
      />

      {requestVaultFund ? (
        <p className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
          {t("admin.fundAfterDeploy")}
        </p>
      ) : null}

      {!vault.isAdmin ? (
        <p className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {t("admin.notAdminBody")}
        </p>
      ) : null}

      <p className="mb-4 text-xs text-slate-500">{t("admin.demoWalletNote")}</p>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat
          label={t("admin.balance")}
          value={`${formatNumber(vault.balanceNight)} ${t("units.night")}`}
          hint={t("units.usdEstimate", {
            usd: formatNumber(nightToUsd(vault.balanceNight), {
              maximumFractionDigits: 2,
            }),
          })}
          tone={empty ? "danger" : low ? "warning" : "success"}
        />
        <Stat
          label={t("admin.totalFunded")}
          value={`${formatNumber(vault.totalFundedNight)} ${t("units.night")}`}
        />
        <Stat
          label={t("admin.totalPaid")}
          value={`${formatNumber(vault.totalPaidNight)} ${t("units.night")}`}
          tone="info"
        />
      </div>

      {typicalReward > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          {t("admin.payoutsCovered", {
            count: payoutsCovered,
            amount: formatNumber(typicalReward),
          })}
        </p>
      ) : null}

      {empty ? (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {t("admin.empty")}
        </p>
      ) : low ? (
        <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          {t("admin.low")}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          {walletConnected && unshieldedBalanceNight !== null ? (
            <p className="text-xs text-slate-400">
              {t("admin.walletBalance", {
                amount: formatNumber(unshieldedBalanceNight, {
                  maximumFractionDigits: 6,
                }),
              })}
            </p>
          ) : null}
          <Field label={t("admin.fundAmount")}>
            <input
              type="number"
              min={0}
              step="any"
              value={fundAmount}
              onChange={(e) => {
                setFundDraftTouched(true);
                setFundAmount(e.target.value);
              }}
              className={inputClass}
            />
          </Field>
          {unshieldedBalanceNight !== null && unshieldedBalanceNight > 0 ? (
            <Button
              variant="ghost"
              disabled={!vault.isAdmin}
              onClick={() => {
                setFundDraftTouched(false);
                applyWalletBalanceDraft();
              }}
            >
              {t("admin.useWalletBalance")}
            </Button>
          ) : null}
          <Button
            full
            disabled={
              !vault.isAdmin ||
              funding ||
              Number(fundAmount) <= 0 ||
              (unshieldedBalanceNight !== null &&
                Number(fundAmount) > unshieldedBalanceNight)
            }
            onClick={async () => {
              const ok = await fundVault(Number(fundAmount));
              if (ok) {
                setFundAmount("");
                setFundDraftTouched(false);
                clearFundPrompt();
                void refreshWalletAfterTx();
              }
            }}
          >
            {funding ? (
              <>
                <Spinner /> {t("admin.funding")}
              </>
            ) : (
              t("admin.fund")
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500">{t("admin.withdrawExplain")}</p>
          <Field label={t("admin.withdrawAmount")}>
            <input
              type="number"
              min={1}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t("admin.withdrawTo")} hint={t("admin.withdrawToHint")}>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Button
            full
            variant="secondary"
            disabled={
              !vault.isAdmin ||
              withdrawing ||
              Number(withdrawAmount) <= 0 ||
              Number(withdrawAmount) > vault.balanceNight
            }
            onClick={async () => {
              const ok = await withdrawVault(
                Number(withdrawAmount),
                recipient.trim() || undefined,
              );
              if (ok) {
                setWithdrawAmount("");
                setRecipient("");
                void refreshWalletAfterTx();
              }
            }}
          >
            {withdrawing ? (
              <>
                <Spinner /> {t("admin.withdrawing")}
              </>
            ) : (
              t("admin.withdraw")
            )}
          </Button>
        </div>
      </div>
    </Card>
    </div>
  );
}
