"use client";

import { SetupNotice } from "@/components/Banners";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { WalletRequired } from "@/components/WalletPanel";
import { useChain } from "@/features/chain/ChainProvider";
import { useMatches } from "@/features/matching/useMatches";
import { MedicalDataSection } from "@/features/patient/MedicalDataSection";
import { OpportunityCard } from "@/features/patient/OpportunityCard";
import { usePatient } from "@/features/patient/PatientProvider";
import { RoleGate } from "@/features/role/RoleGate";
import { useI18n } from "@/i18n";

export default function PatientPage() {
  return (
    <RoleGate allow="patient">
      <PatientDashboard />
    </RoleGate>
  );
}

function PatientDashboard() {
  const { t } = useI18n();
  const { matches, eligibleCount, loading } = useMatches();
  const { refresh, refreshing } = useChain();
  const { medicalStudies } = usePatient();

  const hasData = medicalStudies.length > 0;
  const summary = !hasData
    ? t("matches.summaryNoData")
    : eligibleCount > 0
      ? t("matches.summaryEligible", {
          count: eligibleCount,
          total: matches.length,
        })
      : t("matches.summaryZero");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {t("patient.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t("patient.subtitle")}</p>
        </div>
        <Button variant="ghost" disabled={refreshing} onClick={() => void refresh()}>
          {refreshing ? t("common.refreshing") : t("common.refresh")}
        </Button>
      </header>

      <WalletRequired />
      <SetupNotice />

      <Card tone={eligibleCount > 0 ? "highlight" : "muted"}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={eligibleCount > 0 ? "success" : "neutral"}>
            {eligibleCount}
          </Badge>
          <p className="min-w-0 flex-1 text-sm font-medium text-white">
            {summary}
          </p>
        </div>
      </Card>

      <MedicalDataSection defaultOpen={!hasData} />

      <section className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400">{t("common.loading")}</p>
        ) : matches.length === 0 ? (
          <EmptyState title={t("matches.empty")} />
        ) : (
          matches.map((match) => (
            <OpportunityCard key={match.view.externalStudyId} match={match} />
          ))
        )}
      </section>
    </div>
  );
}
