"use client";

import { useState } from "react";
import { SetupNotice } from "@/components/Banners";
import { Button, EmptyState } from "@/components/ui";
import { WalletRequired } from "@/components/WalletPanel";
import { useChain } from "@/features/chain/ChainProvider";
import { CohortCard } from "@/features/lab/CohortCard";
import { LaunchStudyForm } from "@/features/lab/LaunchStudyForm";
import { RoleGate } from "@/features/role/RoleGate";
import { useI18n } from "@/i18n";

export default function LabPage() {
  return (
    <RoleGate allow="lab">
      <LabDashboard />
    </RoleGate>
  );
}

function LabDashboard() {
  const { t } = useI18n();
  const { myStudies, loading, refresh, refreshing } = useChain();
  const [launching, setLaunching] = useState(false);

  const showForm = launching || (!loading && myStudies.length === 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {t("lab.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t("lab.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={refreshing} onClick={() => void refresh()}>
            {refreshing ? t("common.refreshing") : t("common.refresh")}
          </Button>
          {myStudies.length > 0 ? (
            <Button
              variant={launching ? "ghost" : "primary"}
              onClick={() => setLaunching(!launching)}
            >
              {launching ? t("common.cancel") : t("lab.launchAnother")}
            </Button>
          ) : null}
        </div>
      </header>

      <WalletRequired />
      <SetupNotice />

      {showForm ? <LaunchStudyForm onDone={() => setLaunching(false)} /> : null}

      <section className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400">{t("common.loading")}</p>
        ) : myStudies.length === 0 ? (
          !showForm ? (
            <EmptyState
              title={t("lab.noStudies")}
              action={
                <Button onClick={() => setLaunching(true)}>{t("lab.launch")}</Button>
              }
            />
          ) : null
        ) : (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t("lab.myStudies")}
            </h2>
            {myStudies.map((view) => (
              <CohortCard key={view.externalStudyId} view={view} />
            ))}
            <p className="text-xs text-slate-500">{t("lab.ownershipNote")}</p>
          </>
        )}
      </section>
    </div>
  );
}
