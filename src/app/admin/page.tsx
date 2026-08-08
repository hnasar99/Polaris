"use client";

import { SetupNotice } from "@/components/Banners";
import { Button } from "@/components/ui";
import { WalletPanel } from "@/components/WalletPanel";
import { ContractPanel } from "@/features/admin/ContractPanel";
import { VaultPanel } from "@/features/admin/VaultPanel";
import { useChain } from "@/features/chain/ChainProvider";
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t("admin.subtitle")}</p>
        </div>
        <Button variant="ghost" disabled={refreshing} onClick={() => void refresh()}>
          {refreshing ? t("common.refreshing") : t("common.refresh")}
        </Button>
      </header>

      <SetupNotice />
      <WalletPanel />
      <ContractPanel />
      <VaultPanel />
    </div>
  );
}
