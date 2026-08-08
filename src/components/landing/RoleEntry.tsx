"use client";

import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { useRole } from "@/features/role/RoleProvider";
import { LOGIN_ROLES, ROLE_DEFINITIONS, type AppRole } from "@/features/role/roles";
import { useI18n, type MessageKey } from "@/i18n";

type RoleCardStyle = {
  ring: string;
  glow: string;
  chip: string;
  cta: string;
  points: readonly MessageKey[];
};

const CARD_STYLES: Record<(typeof LOGIN_ROLES)[number], RoleCardStyle> = {
  patient: {
    ring: "hover:border-cyan-300/45 focus-within:border-cyan-300/45",
    glow: "from-cyan-400/20",
    chip: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/25",
    cta: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    points: [
      "roles.patientPoint1",
      "roles.patientPoint2",
      "roles.patientPoint3",
    ],
  },
  lab: {
    ring: "hover:border-indigo-300/45 focus-within:border-indigo-300/45",
    glow: "from-indigo-400/20",
    chip: "bg-indigo-400/10 text-indigo-200 ring-indigo-300/25",
    cta: "bg-indigo-400 text-slate-950 hover:bg-indigo-300",
    points: ["roles.labPoint1", "roles.labPoint2", "roles.labPoint3"],
  },
};

/** The dual login. Wallet connect is only shown to patients once they enter. */
export function RoleEntry() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {LOGIN_ROLES.map((role) => (
        <RoleCard key={role} role={role} />
      ))}
    </div>
  );
}

function RoleCard({ role }: { role: (typeof LOGIN_ROLES)[number] }) {
  const { t } = useI18n();
  const router = useRouter();
  const { role: activeRole, setRole } = useRole();

  const definition = ROLE_DEFINITIONS[role];
  const style = CARD_STYLES[role];
  const isActive = activeRole === role;

  const enter = () => {
    setRole(role);
    router.push(definition.home);
  };

  return (
    <div
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1628]/70 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40",
        style.ring,
      )}
    >
      <div
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          style.glow,
        )}
      />

      <div className="relative flex items-center gap-3">
        <RoleIcon role={role} className={style.chip} />
        <h3 className="text-lg font-semibold text-white">
          {t(definition.nameKey)}
        </h3>
        {isActive ? (
          <span className="ml-auto rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200 ring-1 ring-inset ring-emerald-400/25">
            {t("roles.active")}
          </span>
        ) : null}
      </div>

      <p className="relative mt-3 text-sm leading-relaxed text-slate-400">
        {t(definition.descKey)}
      </p>

      <ul className="relative mt-4 flex-1 space-y-2">
        {style.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm text-slate-300">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80"
            >
              <path
                d="m5 12.5 4.5 4.5L19 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t(point)}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={enter}
        className={cx(
          "relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
          style.cta,
        )}
      >
        {isActive ? t("roles.continue") : t(definition.ctaKey)}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
        >
          <path
            d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function RoleIcon({ role, className }: { role: AppRole; className: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        {role === "patient" ? (
          <path
            d="M12 20.5s-7.2-4.3-7.2-9.4A4.3 4.3 0 0 1 12 8.4a4.3 4.3 0 0 1 7.2 2.7c0 5.1-7.2 9.4-7.2 9.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M9.5 3.5v5.2L4.8 17a2.4 2.4 0 0 0 2.1 3.5h10.2a2.4 2.4 0 0 0 2.1-3.5l-4.7-8.3V3.5M8 3.5h8M8.2 13.6h7.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  );
}
