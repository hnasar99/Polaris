export function ProvedSection() {
  return (
    <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
        Proved
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-emerald-50">
        <li>Eligibility: verified</li>
        <li>Medical issuer: verified</li>
      </ul>
    </section>
  );
}

export function NotDisclosedSection() {
  return (
    <section className="rounded-xl border border-slate-500/30 bg-slate-500/10 p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
        Not Disclosed
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        <li>Name</li>
        <li>Exact age</li>
        <li>Exact HbA1c</li>
        <li>Complete medical history</li>
        <li>Other medical conditions</li>
      </ul>
      <p className="mt-4 text-xs text-slate-400">
        Private values stay on the patient client. Only the eligibility result
        is returned from the protocol adapter.
      </p>
    </section>
  );
}
