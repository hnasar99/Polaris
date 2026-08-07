"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/features/app/AppStateProvider";

export default function StudiesPage() {
  const router = useRouter();
  const {
    loading,
    studies,
    walletConnected,
    checkEligibilityPrivately,
    eligibility,
  } = useAppState();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Research opportunities
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Studies
        </h1>
        <p className="max-w-2xl text-slate-400">
          Check eligibility privately through the Midnight protocol adapter.
          Criteria are not evaluated in this UI.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-400">Loading studies…</p>
      ) : (
        studies.map((study) => (
          <article
            key={study.id}
            className="rounded-xl border border-cyan-500/20 bg-[#0b1628] p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Study #001 · {study.externalStudyId}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {study.title}
                </h2>
              </div>
              <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-100">
                Reward: {study.rewardAmount} {study.rewardSymbol}
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-300">{study.description}</p>

            <ul className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
              <li className="rounded-lg bg-black/20 px-3 py-2">
                Zero-knowledge eligibility
              </li>
              <li className="rounded-lg bg-black/20 px-3 py-2">
                Identity remains private
              </li>
              <li className="rounded-lg bg-black/20 px-3 py-2">
                Raw medical record is not disclosed
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={eligibility.status === "checking"}
                onClick={async () => {
                  await checkEligibilityPrivately(study);
                  router.push("/eligibility");
                }}
                className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#041018] hover:bg-cyan-400 disabled:opacity-60"
              >
                {eligibility.status === "checking"
                  ? "Checking…"
                  : "Check Eligibility Privately"}
              </button>
              {!walletConnected && (
                <span className="text-xs text-amber-200/80">
                  Connect a wallet on the Health Vault screen first.
                </span>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
