"use client";

import { useState } from "react";
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
import { useI18n } from "@/i18n";

/**
 * The vault is the contract's only liquidity. Everything here is gated by
 * `assertAdmin` on-chain — the disabled state is a courtesy, not the control.
 */
export function VaultPanel() {
  const { t, formatNumber } = useI18n();
  const { vault, studies, busyKey, fundVault, withdrawVault } = useChain();
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const funding = busyKey === "vault:fund";
  const withdrawing = busyKey === "vault:withdraw";

  const typicalReward =
    studies.length > 0
      ? Math.max(...studies.filter((s) => s.active).map((s) => s.rewardAmount), 0)
      : 0;
  const payoutsCovered =
    typicalReward > 0 ? Math.floor(vault.balanceNight / typicalReward) : 0;

  // Only a vault that was actually read can be reported as empty or low.
  const empty = vault.known && vault.balanceNight <= 0;
  const low = vault.known && !empty && typicalReward > 0 && payoutsCovered < 3;

  return (
    <Card>
      <SectionHeader
        title={t("admin.vaultTitle")}
        subtitle={t("admin.subtitle")}
        action={
          <Badge tone={vault.isAdmin ? "success" : "danger"}>
            {vault.isAdmin ? t("admin.isAdmin") : t("admin.notAdmin")}
          </Badge>
        }
      />

      {!vault.isAdmin ? (
        <p className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {t("admin.notAdminBody")}
        </p>
      ) : null}

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
          <Field label={t("admin.fundAmount")}>
            <input
              type="number"
              min={1}
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Button
            full
            disabled={!vault.isAdmin || funding || Number(fundAmount) <= 0}
            onClick={async () => {
              const ok = await fundVault(Number(fundAmount));
              if (ok) setFundAmount("");
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
  );
}
