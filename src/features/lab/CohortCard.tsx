"use client";

import { Badge, Button, Card, Stat } from "@/components/ui";
import { nightToUsd } from "@/domain/pricing";
import type { StudyView } from "@/domain/study/types";
import { useChain } from "@/features/chain/ChainProvider";
import { useI18n } from "@/i18n";
import { hba1cFromScaled } from "@/lib/format";
import { starsToNight } from "@/lib/midnight/encoding";

/**
 * Everything shown here is a ledger aggregate. There is no row per person and
 * no path from this view back to a patient.
 */
export function CohortCard({ view }: { view: StudyView }) {
  const { t, formatNumber } = useI18n();
  const { busyKey, closeStudy, vaultCovers } = useChain();
  const chain = view.chain;
  const busy = busyKey === `close:${view.externalStudyId}`;
  const covered = vaultCovers(view.rewardAmount);

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone={view.active ? "success" : "neutral"}>
              {view.active ? t("lab.active") : t("lab.inactive")}
            </Badge>
            {!chain ? <Badge tone="warning">{t("lab.notOnChain")}</Badge> : null}
          </div>
          <h3 className="text-base font-semibold text-white">{view.title}</h3>
          <p className="font-mono text-xs text-slate-500">
            {view.externalStudyId}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-cyan-200 tabular-nums">
            {formatNumber(view.rewardAmount)} {t("units.night")}
          </p>
          <p className="text-xs text-slate-500">
            {t("units.usdEstimate", {
              usd: formatNumber(nightToUsd(view.rewardAmount), {
                maximumFractionDigits: 2,
              }),
            })}{" "}
            · {t("matches.perParticipant")}
          </p>
        </div>
      </div>

      {!chain ? (
        <p className="mt-3 text-sm text-amber-200">{t("lab.notOnChainHint")}</p>
      ) : null}

      {chain && view.active && !covered ? (
        <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          {t("lab.vaultLow", { amount: formatNumber(view.rewardAmount) })}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label={t("lab.eligibleProofs")}
          value={formatNumber(chain?.eligibleCount ?? 0)}
        />
        <Stat
          label={t("lab.consents")}
          value={formatNumber(chain?.consentCount ?? 0)}
          tone="info"
        />
        <Stat
          label={t("lab.claims")}
          value={formatNumber(chain?.claimCount ?? 0)}
        />
        <Stat
          label={t("lab.paid")}
          value={`${formatNumber(starsToNight(chain?.spentStars ?? 0n))} ${t("units.night")}`}
        />
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-slate-400">
          {t("matches.criteria")}
        </summary>
        <ul className="mt-2 grid gap-1 text-sm text-slate-300 sm:grid-cols-2">
          <li>
            {t("matches.minAge")}: {view.criteria.minAge}
          </li>
          <li>
            {t("matches.diagnosis")}: {view.criteria.requiredDiagnosis}
          </li>
          <li>
            {t("matches.minHba1c")}:{" "}
            {hba1cFromScaled(view.criteria.minHba1cScaled)}%
          </li>
          <li>
            {t("matches.treatment")}: {view.criteria.requiredTreatment}
          </li>
          <li>
            {t("matches.minTreatmentMonths")}:{" "}
            {view.criteria.minTreatmentMonths}
          </li>
        </ul>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {view.active ? (
          <Button
            variant="secondary"
            disabled={busy || !chain}
            onClick={() => void closeStudy(view)}
          >
            {busy ? t("lab.closing") : t("lab.close")}
          </Button>
        ) : null}
        <p className="text-xs text-slate-500">{t("lab.cohortBody")}</p>
      </div>
    </Card>
  );
}
