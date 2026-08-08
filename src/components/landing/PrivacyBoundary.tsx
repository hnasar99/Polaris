"use client";

import type { MessageKey } from "@/i18n";
import { useI18n } from "@/i18n";

const PRIVATE_CHIPS: MessageKey[] = [
  "landing.boundaryChipAge",
  "landing.boundaryChipDiagnosis",
  "landing.boundaryChipHba1c",
  "landing.boundaryChipTreatment",
  "landing.boundaryChipMonths",
];

/**
 * The privacy boundary, drawn.
 *
 * Left: the five witness values, on the patient's device. Middle: the Compact
 * circuit. Right: the ledger, which only ever receives the proof. Wires stream
 * inward on the private side and carry a single travelling packet outward, so
 * the asymmetry is visible rather than asserted.
 */
export function PrivacyBoundary() {
  const { t } = useI18n();

  return (
    <figure className="relative">
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)] lg:gap-0">
        <DevicePanel />
        <BoundaryColumn />
        <LedgerPanel />
      </div>

      <figcaption className="sr-only">
        {t("landing.boundaryDiagramLabel")}
      </figcaption>
    </figure>
  );
}

function DevicePanel() {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.07] to-transparent p-5 backdrop-blur">
      {/* Sweeping scan line, hinting at local computation. */}
      <div
        aria-hidden
        className="mn-animate-scan pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-emerald-300/10 to-transparent"
      />

      <PanelHeading
        tone="emerald"
        title={t("landing.boundaryDeviceTitle")}
        hint={t("landing.boundaryDeviceHint")}
        icon={
          <path
            d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Zm3.5 14h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        }
      />

      <ul className="relative mt-4 flex flex-wrap gap-2">
        {PRIVATE_CHIPS.map((key, index) => (
          <li
            key={key}
            className="mn-animate-blink flex items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.08] px-2.5 py-1.5 font-mono text-xs text-emerald-100"
            style={{ animationDelay: `${index * 400}ms`, animationDuration: "5s" }}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3 shrink-0">
              <path
                d="M7 10V7.5a5 5 0 0 1 10 0V10M5.5 10h13v9.5h-13z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {t(key)}
          </li>
        ))}
      </ul>

      <p className="relative mt-4 flex items-center gap-2 text-xs font-medium text-rose-200/80">
        <span aria-hidden className="h-px flex-1 bg-rose-400/25" />
        {t("landing.boundaryBlocked")}
        <span aria-hidden className="h-px flex-1 bg-rose-400/25" />
      </p>
    </div>
  );
}

function BoundaryColumn() {
  const { t } = useI18n();

  return (
    <div className="relative flex h-28 items-center justify-center lg:h-56">
      {/* Desktop wires: five strands stream in, one packet leaves. */}
      <svg
        aria-hidden
        viewBox="0 0 190 224"
        preserveAspectRatio="none"
        className="absolute inset-0 hidden h-full w-full lg:block"
      >
        {[36, 76, 112, 148, 188].map((y) => (
          <path
            key={y}
            d={`M0 ${y} C 46 ${y}, 58 112, 95 112`}
            fill="none"
            stroke="rgba(52, 211, 153, 0.42)"
            strokeWidth="1.4"
            className="mn-animate-flow"
          />
        ))}
        <path
          d="M95 112 H 190"
          fill="none"
          stroke="rgba(103, 232, 249, 0.18)"
          strokeWidth="1.4"
        />
        <path
          d="M95 112 H 190"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="mn-animate-packet"
        />
      </svg>

      {/* Mobile: the same story rotated into a single vertical wire. */}
      <svg
        aria-hidden
        viewBox="0 0 40 112"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full lg:hidden"
      >
        <path
          d="M20 0 V 44"
          fill="none"
          stroke="rgba(52, 211, 153, 0.45)"
          strokeWidth="1.4"
          className="mn-animate-flow"
        />
        <path
          d="M20 68 V 112"
          fill="none"
          stroke="rgba(103, 232, 249, 0.2)"
          strokeWidth="1.4"
        />
        <path
          d="M20 68 V 112"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="mn-animate-packet"
        />
      </svg>

      <div className="relative">
        <span
          aria-hidden
          className="mn-animate-pulse-ring absolute inset-0 rounded-2xl bg-cyan-400/25"
        />
        <span
          aria-hidden
          className="mn-animate-pulse-ring absolute inset-0 rounded-2xl bg-cyan-400/20"
          style={{ animationDelay: "1.7s" }}
        />
        <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/40 bg-[#07111f] shadow-[0_0_40px_-6px_rgba(34,211,238,0.55)]">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="mn-animate-spin-slow h-7 w-7 text-cyan-200"
          >
            <path
              d="M12 2.6 20.2 7v10L12 21.4 3.8 17V7L12 2.6Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.6 16.4 10v4L12 16.4 7.6 14v-4L12 7.6Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="absolute left-1/2 top-full mt-2 w-36 -translate-x-1/2 text-center text-[11px] font-semibold uppercase tracking-wider text-cyan-200/90">
          {t("landing.boundaryCircuitTitle")}
        </p>
      </div>
    </div>
  );
}

function LedgerPanel() {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-bl from-cyan-400/[0.07] to-transparent p-5 backdrop-blur">
      <PanelHeading
        tone="cyan"
        title={t("landing.boundaryLedgerTitle")}
        hint={t("landing.boundaryLedgerHint")}
        icon={
          <path
            d="M4 7c0-1.4 3.6-2.5 8-2.5S20 5.6 20 7v10c0 1.4-3.6 2.5-8 2.5S4 18.4 4 17V7Zm0 0c0 1.4 3.6 2.5 8 2.5S20 8.4 20 7m-16 5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        }
      />

      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2.5">
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 text-cyan-200">
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-mono text-xs font-semibold text-cyan-100">
          {t("landing.boundaryProof")}
        </span>
      </div>

      {/* Aggregate counters — the only per-study numbers the ledger holds. */}
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ["lab.eligibleProofs", "24"],
            ["lab.consents", "18"],
            ["lab.claims", "11"],
          ] as const
        ).map(([labelKey, value]) => (
          <div
            key={labelKey}
            className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5"
          >
            <dt className="truncate text-[10px] uppercase tracking-wide text-slate-500">
              {t(labelKey)}
            </dt>
            <dd className="font-mono text-sm tabular-nums text-slate-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PanelHeading({
  tone,
  title,
  hint,
  icon,
}: {
  tone: "emerald" | "cyan";
  title: string;
  hint: string;
  icon: React.ReactNode;
}) {
  const tones = {
    emerald: "text-emerald-200 ring-emerald-300/25 bg-emerald-400/10",
    cyan: "text-cyan-200 ring-cyan-300/25 bg-cyan-400/10",
  } as const;

  return (
    <div className="relative flex items-start gap-3">
      <span
        aria-hidden
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${tones[tone]}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          {icon}
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
    </div>
  );
}
