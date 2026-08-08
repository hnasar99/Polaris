"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Spinner,
  cx,
  inputClass,
} from "@/components/ui";
import {
  CONSENT_SCOPE_FIELDS,
  DEFAULT_CONSENT_DURATION_DAYS,
  type ConsentScopeField,
} from "@/domain/consent/types";
import { nightToUsd } from "@/domain/pricing";
import { useChain } from "@/features/chain/ChainProvider";
import { studyAnchorId } from "@/features/matching/inbox";
import type { CriterionKey } from "@/features/matching/matcher";
import type { StudyMatch } from "@/features/matching/useMatches";
import { usePatient } from "@/features/patient/PatientProvider";
import { useI18n, type MessageKey } from "@/i18n";
import { hba1cFromScaled } from "@/lib/format";

const SCOPE_KEY: Record<ConsentScopeField, MessageKey> = {
  diagnosis: "consent.scopeDiagnosis",
  lab_result: "consent.scopeLabResult",
  treatment: "consent.scopeTreatment",
  treatment_duration: "consent.scopeTreatmentDuration",
};

export function OpportunityCard({ match }: { match: StudyMatch }) {
  const { t, formatNumber, formatDate } = useI18n();
  const { view, rank, progress } = match;
  const {
    busyKey,
    proveEligibility,
    grantConsent,
    claimReward,
    revokeConsent,
    vaultCovers,
  } = useChain();
  const { derived } = usePatient();
  const [reviewing, setReviewing] = useState(false);

  const closed = !view.active;
  const badge = closed
    ? { tone: "neutral" as const, label: t("matches.badgeClosed") }
    : rank === "eligible"
      ? { tone: "success" as const, label: t("matches.badgeEligible") }
      : rank === "undetermined"
        ? { tone: "warning" as const, label: t("matches.badgeUndetermined") }
        : { tone: "neutral" as const, label: t("matches.badgeNotMatching") };

  const proved = progress.eligibility === "eligible";
  const consented = progress.consent === "active";
  const claimed = progress.reward === "claimed";
  const covered = vaultCovers(view.rewardAmount);

  const busy = (key: string) => busyKey === `${key}:${view.externalStudyId}`;

  return (
    <Card
      id={studyAnchorId(view.externalStudyId)}
      tone={rank === "eligible" && !closed ? "highlight" : "default"}
      className="scroll-mt-24 transition"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            {claimed ? <Badge tone="info">{t("matches.claimed")}</Badge> : null}
            {consented && !claimed ? (
              <Badge tone="info">{t("matches.consentActive")}</Badge>
            ) : null}
          </div>
          <h3 className="text-base font-semibold text-white">{view.title}</h3>
          <p className="text-xs text-slate-400">
            {t("matches.eligibleFrom", { lab: view.researcherAlias })}
          </p>
          {view.description ? (
            <p className="mt-2 text-sm text-slate-300">{view.description}</p>
          ) : null}
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
            })}
          </p>
          <p className="text-xs text-slate-500">{t("matches.perParticipant")}</p>
        </div>
      </div>

      <CriteriaList match={match} />

      {rank === "undetermined" && !closed ? (
        <p className="mt-3 text-sm text-amber-200">{t("matches.missingDataCta")}</p>
      ) : null}

      {!covered && !closed && !claimed ? (
        <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          {t("matches.underfunded")}
        </p>
      ) : null}

      {closed ? null : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!proved ? (
            <Button
              disabled={rank !== "eligible" || busy("prove")}
              onClick={() => void proveEligibility(view, derived.witness)}
            >
              {busy("prove") ? (
                <>
                  <Spinner /> {t("matches.checking")}
                </>
              ) : (
                t("matches.checkPrivately")
              )}
            </Button>
          ) : null}

          {proved && !consented ? (
            <Button onClick={() => setReviewing(!reviewing)}>
              {t("matches.consentCta")}
            </Button>
          ) : null}

          {consented && !claimed ? (
            <Button
              disabled={busy("claim") || !covered}
              onClick={() => void claimReward(view)}
            >
              {busy("claim") ? (
                <>
                  <Spinner /> {t("matches.claiming")}
                </>
              ) : (
                t("matches.claim", { amount: formatNumber(view.rewardAmount) })
              )}
            </Button>
          ) : null}

          {consented ? (
            <Button
              variant="ghost"
              disabled={busy("revoke")}
              onClick={() => void revokeConsent(view)}
            >
              {busy("revoke") ? t("consent.revoking") : t("consent.revoke")}
            </Button>
          ) : null}

          {progress.eligibility === "not_eligible" ? (
            <span className="text-sm text-slate-400">
              {t("matches.notEligibleBody")}
            </span>
          ) : null}
        </div>
      )}

      {reviewing && proved && !consented ? (
        <ConsentReview
          researcherAlias={view.researcherAlias}
          busy={busy("consent")}
          onCancel={() => setReviewing(false)}
          onConfirm={async (options) => {
            const ok = await grantConsent(view, options);
            if (ok) setReviewing(false);
          }}
        />
      ) : null}

      {consented && progress.consentExpiresAt ? (
        <p className="mt-3 text-xs text-slate-500">
          {t("consent.expiresAt")}: {formatDate(progress.consentExpiresAt)} ·{" "}
          {t("consent.scope")}:{" "}
          {progress.consentScope.map((f) => t(SCOPE_KEY[f])).join(", ")}
        </p>
      ) : null}

      {claimed ? (
        <p className="mt-3 text-xs text-slate-500">{t("matches.claimHint")}</p>
      ) : null}
    </Card>
  );
}

const CRITERION_LABEL: Record<CriterionKey, MessageKey> = {
  minAge: "matches.minAge",
  requiredDiagnosis: "matches.diagnosis",
  minHba1cScaled: "matches.minHba1c",
  requiredTreatment: "matches.treatment",
  minTreatmentMonths: "matches.minTreatmentMonths",
};

function CriteriaList({ match }: { match: StudyMatch }) {
  const { t } = useI18n();
  const { criteria } = match.view;

  const values: Record<CriterionKey, string> = {
    minAge: `${criteria.minAge}+`,
    requiredDiagnosis: criteria.requiredDiagnosis,
    minHba1cScaled: `${hba1cFromScaled(criteria.minHba1cScaled)}%+`,
    requiredTreatment: criteria.requiredTreatment,
    minTreatmentMonths: `${criteria.minTreatmentMonths}+`,
  };

  const failed = new Set(match.match.failed);
  const unknown = new Set(match.match.undetermined);

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {(Object.keys(values) as CriterionKey[]).map((key) => {
        const state = failed.has(key)
          ? "failed"
          : unknown.has(key)
            ? "unknown"
            : "met";
        return (
          <li
            key={key}
            title={t(
              state === "met"
                ? "matches.requirementMet"
                : state === "failed"
                  ? "matches.requirementFailed"
                  : "matches.requirementUnknown",
            )}
            className={cx(
              "rounded-lg px-2.5 py-1 text-xs ring-1 ring-inset",
              state === "met" && "bg-emerald-400/10 text-emerald-200 ring-emerald-400/20",
              state === "failed" && "bg-white/5 text-slate-400 ring-white/10 line-through",
              state === "unknown" && "bg-amber-400/10 text-amber-200 ring-amber-400/20",
            )}
          >
            {t(CRITERION_LABEL[key])}: {values[key]}
          </li>
        );
      })}
    </ul>
  );
}

function ConsentReview({
  researcherAlias,
  busy,
  onCancel,
  onConfirm,
}: {
  researcherAlias: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (options: {
    scope: ConsentScopeField[];
    purpose: string;
    durationDays: number;
  }) => void;
}) {
  const { t, formatDate } = useI18n();
  const [scope, setScope] = useState<ConsentScopeField[]>([
    ...CONSENT_SCOPE_FIELDS,
  ]);
  const [purpose, setPurpose] = useState(
    t("matches.eligibleFrom", { lab: researcherAlias }),
  );
  const [days, setDays] = useState(DEFAULT_CONSENT_DURATION_DAYS);

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-4">
      <div>
        <p className="text-sm font-semibold text-white">
          {t("consent.reviewTitle")}
        </p>
        <p className="mt-1 text-sm text-slate-300">{t("consent.reviewBody")}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          {t("consent.scope")}
        </p>
        <div className="flex flex-wrap gap-2">
          {CONSENT_SCOPE_FIELDS.map((field) => {
            const on = scope.includes(field);
            return (
              <button
                key={field}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setScope(
                    on
                      ? scope.filter((f) => f !== field)
                      : [...scope, field],
                  )
                }
                className={cx(
                  "rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition",
                  on
                    ? "bg-cyan-400/20 text-cyan-100 ring-cyan-400/40"
                    : "bg-white/5 text-slate-400 ring-white/10",
                )}
              >
                {t(SCOPE_KEY[field])}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("consent.purpose")}
          </span>
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("consent.duration")}
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 1)}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-slate-500">
            {t("consent.expiresAt")}: {formatDate(expiry)}
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy || scope.length === 0 || purpose.trim().length === 0}
          onClick={() =>
            onConfirm({ scope, purpose: purpose.trim(), durationDays: days })
          }
        >
          {busy ? (
            <>
              <Spinner /> {t("matches.granting")}
            </>
          ) : (
            t("consent.grant")
          )}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
