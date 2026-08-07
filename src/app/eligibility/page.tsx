"use client";

import Link from "next/link";
import {
  NotDisclosedSection,
  ProvedSection,
} from "@/components/ProvedNotDisclosed";
import { useAppState } from "@/features/app/AppStateProvider";

export default function EligibilityPage() {
  const {
    selectedStudy,
    eligibility,
    consent,
    reward,
    demoMode,
    grantConsent,
    revokeConsent,
    claimReward,
  } = useAppState();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          ZK result + consent
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Eligibility
        </h1>
        <p className="max-w-2xl text-slate-400">
          {selectedStudy
            ? `${selectedStudy.title} · ${selectedStudy.externalStudyId}`
            : "Select a study and check eligibility privately."}
        </p>
      </header>

      {eligibility.status === "idle" && (
        <EmptyState message="No eligibility check yet. Open Studies and choose Check Eligibility Privately." />
      )}

      {eligibility.status === "checking" && (
        <EmptyState message="Preparing private witness and calling the Midnight protocol adapter…" />
      )}

      {eligibility.status === "error" && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          <p className="font-semibold">Eligibility check failed</p>
          <p className="mt-2">{eligibility.message}</p>
          <p className="mt-1 text-rose-200/70">({eligibility.errorCode})</p>
          <Link
            href="/studies"
            className="mt-4 inline-block text-cyan-300 underline-offset-2 hover:underline"
          >
            Back to studies
          </Link>
        </div>
      )}

      {eligibility.status === "not_eligible" && (
        <div className="rounded-xl border border-slate-500/30 bg-[#0b1628] p-6">
          <h2 className="text-2xl font-semibold text-white">Not eligible</h2>
          <p className="mt-2 text-sm text-slate-400">
            The protocol adapter returned eligible = false. Private medical
            values were not disclosed.
          </p>
          {demoMode && (
            <p className="mt-3 text-xs text-amber-200/80">
              DEMO PRIVACY ENGINE result — not a ZK proof verified on Midnight.
            </p>
          )}
        </div>
      )}

      {eligibility.status === "eligible" && (
        <>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <h2 className="text-3xl font-bold tracking-tight text-emerald-200">
              You Qualify
            </h2>
            <p className="mt-2 text-sm text-emerald-100/80">
              Eligibility result received. Exact private values are not shown.
            </p>
            {demoMode && (
              <p className="mt-3 text-xs text-amber-200/90">
                DEMO PRIVACY ENGINE — local evaluation only. Do not describe
                this as a ZK proof verified on Midnight.
              </p>
            )}
            {eligibility.proofReference && (
              <p className="mt-3 font-mono text-xs text-emerald-100/60">
                ref: {eligibility.proofReference}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProvedSection />
            <NotDisclosedSection />
          </div>

          <section className="rounded-xl border border-cyan-500/20 bg-[#0b1628] p-6">
            <h3 className="text-lg font-semibold text-white">
              Research access request
            </h3>
            <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Researcher requests</dt>
                <dd className="mt-1">Treatment</dd>
                <dd>Treatment duration range / duration</dd>
              </div>
              <div>
                <dt className="text-slate-500">Purpose</dt>
                <dd className="mt-1">Type 2 Diabetes Research</dd>
              </div>
              <div>
                <dt className="text-slate-500">Access duration</dt>
                <dd className="mt-1">30 days</dd>
              </div>
              <div>
                <dt className="text-slate-500">Compensation</dt>
                <dd className="mt-1">
                  {selectedStudy
                    ? `${selectedStudy.rewardAmount} ${selectedStudy.rewardSymbol}`
                    : "25 TEST"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {consent.status !== "active" && (
                <button
                  type="button"
                  onClick={() => void grantConsent()}
                  disabled={consent.status === "pending"}
                  className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#041018] hover:bg-cyan-400 disabled:opacity-60"
                >
                  {consent.status === "pending"
                    ? "Authorizing…"
                    : "Authorize Research Access"}
                </button>
              )}
              {consent.status === "active" && (
                <>
                  <span className="inline-flex items-center rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                    Consent Active
                  </span>
                  <button
                    type="button"
                    onClick={() => void revokeConsent()}
                    className="rounded-md border border-rose-400/40 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/10"
                  >
                    Revoke Consent
                  </button>
                </>
              )}
              {consent.status === "revoked" && (
                <span className="inline-flex items-center rounded-md border border-slate-500/40 px-3 py-2 text-sm text-slate-300">
                  Consent Revoked — access denied
                </span>
              )}
            </div>

            {reward.status === "available" && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-sm text-slate-400">
                  Reward available through the Midnight adapter
                  {demoMode
                    ? " (demo settlement — not real chain rewards)."
                    : " (real settlement pending Compact wiring)."}
                </p>
                <button
                  type="button"
                  onClick={() => void claimReward()}
                  className="mt-3 rounded-md border border-cyan-400/40 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/10"
                >
                  Claim Reward (25 TEST)
                </button>
              </div>
            )}
            {reward.status === "claimed" && (
              <p className="mt-4 text-sm text-slate-400">
                Reward claimed (adapter reference: {reward.transactionId}).
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-cyan-500/15 bg-[#0b1628] p-6 text-sm text-slate-300">
      <p>{message}</p>
      <Link
        href="/studies"
        className="mt-4 inline-block text-cyan-300 underline-offset-2 hover:underline"
      >
        Go to studies
      </Link>
    </div>
  );
}
