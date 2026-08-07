"use client";

import { useAppState } from "@/features/app/AppStateProvider";

export default function ResearcherPage() {
  const { selectedStudy, researcherRows, eligibility, consent } = useAppState();

  const candidates = researcherRows.length;
  const eligibleProofs =
    eligibility.status === "eligible" ? 1 : 0;
  const activeConsents = consent.status === "active" ? 1 : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Researcher
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Research Study #001
        </h1>
        <p className="max-w-2xl text-slate-400">
          {selectedStudy?.title ?? "Type 2 Diabetes Treatment Study"}. Anonymous
          participants only — never display medical records.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Candidates" value={candidates} />
        <Metric label="Eligible proofs" value={eligibleProofs} />
        <Metric label="Active consents" value={activeConsents} />
      </div>

      <section className="rounded-xl border border-cyan-500/20 bg-[#0b1628] p-6">
        <h2 className="text-lg font-semibold text-white">
          Anonymous participants
        </h2>
        {researcherRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No eligibility or consent events yet. When a patient proves
            eligibility, an anonymous row appears here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {researcherRows.map((row) => (
              <li
                key={row.anonId}
                className="rounded-lg border border-white/10 bg-black/20 px-4 py-3"
              >
                <p className="font-mono text-sm font-semibold text-cyan-100">
                  {row.anonId}
                </p>
                <dl className="mt-2 grid gap-1 text-xs text-slate-300 sm:grid-cols-2">
                  <div>Eligibility: {row.eligibility}</div>
                  <div>Medical issuer: {row.medicalIssuer}</div>
                  <div>Consent: {row.consent}</div>
                  <div>Identity: {row.identity}</div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0b1628] p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
