"use client";

import { useCallback, useState } from "react";
import { SetupNotice } from "@/components/Banners";
import { RefreshIconButton } from "@/components/RefreshIconButton";
import { WalletPanel } from "@/components/WalletPanel";
import { ContractPanel } from "@/features/admin/ContractPanel";
import { VaultPanel } from "@/features/admin/VaultPanel";
import { useChain } from "@/features/chain/ChainProvider";
import { useWallet } from "@/features/wallet/WalletProvider";
import { RoleGate } from "@/features/role/RoleGate";
import { useI18n } from "@/i18n";

export default function AdminPage() {
  return (
    <RoleGate allow="admin">
      <AdminConsole />
    </RoleGate>
  );
}

function AdminConsole() {
  const { t } = useI18n();
  const { refresh, refreshing } = useChain();
  const { refreshWalletBalance } = useWallet();
  const [balancesRefreshing, setBalancesRefreshing] = useState(false);

  const refreshBalances = useCallback(async () => {
    setBalancesRefreshing(true);
    try {
      await Promise.all([refresh(), refreshWalletBalance()]);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await refreshWalletBalance();
    } finally {
      setBalancesRefreshing(false);
    }
  }, [refresh, refreshWalletBalance]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t("admin.subtitle")}</p>
        </div>
        <RefreshIconButton
          refreshing={balancesRefreshing || refreshing}
          onClick={refreshBalances}
        />
      </header>

      <SetupNotice />
      <WalletPanel />
      <ContractPanel />
      <VaultPanel />
    </div>
  );
}
