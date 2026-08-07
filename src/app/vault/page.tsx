"use client";

import { WalletPanel } from "@/components/WalletPanel";
import { useAppState } from "@/features/app/AppStateProvider";

export default function VaultPage() {
  const { loading, medicalRecord } = useAppState();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Patient
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Private Health Vault
        </h1>
        <p className="max-w-2xl text-slate-400">
          Verified medical credentials stay private, controlled by you, and are
          not published on the public ledger. Synthetic demo data only.
        </p>
      </header>

      <WalletPanel />

      {loading || !medicalRecord ? (
        <p className="text-sm text-slate-400">Loading vault…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <VaultAttribute
            title="Verified Diagnosis"
            detail="Credential present"
            note="Private data · Controlled by you"
          />
          <VaultAttribute
            title="Verified Laboratory Result"
            detail="Lab credential present"
            note="Not published on the public ledger"
          />
          <VaultAttribute
            title="Verified Treatment"
            detail="Treatment credential present"
            note="Private data · Controlled by you"
          />
        </div>
      )}

      <p className="text-xs text-slate-500">
        Issuer: HOSPITAL_DEMO (simulated). Exact clinical values are not shown
        on this screen beyond presence of verified attributes.
      </p>
    </div>
  );
}

function VaultAttribute({
  title,
  detail,
  note,
}: {
  title: string;
  detail: string;
  note: string;
}) {
  return (
    <article className="rounded-xl border border-cyan-500/20 bg-[#0b1628] p-5">
      <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
        Verified
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
      <p className="mt-4 text-xs text-slate-500">{note}</p>
    </article>
  );
}
