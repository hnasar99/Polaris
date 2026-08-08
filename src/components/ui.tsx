"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "highlight" | "muted";
}) {
  const tones = {
    default: "border-white/10 bg-[#0b1628]/80",
    highlight: "border-cyan-400/40 bg-cyan-400/5",
    muted: "border-white/5 bg-white/[0.02]",
  } as const;

  return (
    <section
      className={cx(
        "rounded-2xl border p-4 sm:p-5 backdrop-blur",
        tones[tone],
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-white sm:text-lg">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const BADGE_TONES = {
  success: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30",
  warning: "bg-amber-400/15 text-amber-200 ring-amber-400/30",
  danger: "bg-rose-400/15 text-rose-200 ring-rose-400/30",
  info: "bg-cyan-400/15 text-cyan-200 ring-cyan-400/30",
  neutral: "bg-white/5 text-slate-300 ring-white/10",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  full?: boolean;
};

export function Button({
  variant = "primary",
  full,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:bg-cyan-400/40 disabled:text-slate-900/60",
    secondary:
      "bg-white/10 text-white hover:bg-white/15 disabled:bg-white/5 disabled:text-slate-500",
    ghost:
      "text-slate-300 hover:bg-white/5 hover:text-white disabled:text-slate-600",
    danger:
      "bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-400/30 hover:bg-rose-500/25 disabled:text-rose-200/40",
  } as const;

  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed",
        variants[variant],
        full && "w-full",
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#050b14] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20";

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: BadgeTone;
}) {
  const valueTones = {
    success: "text-emerald-200",
    warning: "text-amber-200",
    danger: "text-rose-200",
    info: "text-cyan-200",
    neutral: "text-white",
  } as const;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cx("mt-1 text-xl font-semibold tabular-nums", valueTones[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      {body ? <p className="mt-1 text-sm text-slate-400">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
