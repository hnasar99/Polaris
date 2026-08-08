"use client";

import { useRouter } from "next/navigation";
import { Spinner, cx } from "@/components/ui";
import { useRole } from "@/features/role/RoleProvider";
import { LOGIN_ROLES, ROLE_DEFINITIONS, type AppRole } from "@/features/role/roles";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n, type MessageKey } from "@/i18n";
import { truncateAddress } from "@/lib/format";

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

/**
 * The dual login. Both paths are always usable: a wallet is required to sign
 * anything on-chain, not to choose a role, so a visitor with no extension still
 * gets a working entry point instead of a disabled button.
 */
export function RoleEntry() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {LOGIN_ROLES.map((role) => (
          <RoleCard key={role} role={role} />
        ))}
      </div>
      <WalletStrip />
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

/** All four wallet states, so no state leaves the visitor with a dead button. */
function WalletStrip() {
  const { t } = useI18n();
  const {
    walletStatus,
    walletAddress,
    walletConnected,
    isConnecting,
    connect,
    disconnect,
    recheckWallets,
  } = useWallet();

  if (walletConnected && walletAddress) {
    return (
      <Strip tone="success">
        <StatusDot tone="success" />
        <span className="min-w-0 flex-1 text-sm text-emerald-100">
          {t("wallet.connected")}
          <span className="ml-2 font-mono text-xs text-emerald-300/80">
            {truncateAddress(walletAddress)}
          </span>
        </span>
        <StripButton onClick={() => void disconnect()}>
          {t("wallet.disconnect")}
        </StripButton>
      </Strip>
    );
  }

  if (walletStatus === "checking") {
    return (
      <Strip tone="neutral">
        <Spinner />
        <span className="min-w-0 flex-1 text-sm text-slate-400">
          {t("wallet.checking")}
        </span>
      </Strip>
    );
  }

  if (walletStatus === "not-found") {
    return (
      <Strip tone="warning">
        <StatusDot tone="warning" />
        <span className="min-w-0 flex-1 text-sm text-amber-100">
          {t("wallet.install")}
        </span>
        <StripButton onClick={recheckWallets}>
          {t("wallet.checkAgain")}
        </StripButton>
      </Strip>
    );
  }

  return (
    <Strip tone="info">
      <StatusDot tone="info" />
      <span className="min-w-0 flex-1 text-sm text-cyan-100">
        {t("wallet.stepBody")}
      </span>
      <StripButton onClick={() => void connect()} disabled={isConnecting}>
        {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
      </StripButton>
    </Strip>
  );
}

const STRIP_TONES = {
  success: "border-emerald-400/25 bg-emerald-400/[0.07]",
  warning: "border-amber-400/25 bg-amber-400/[0.07]",
  info: "border-cyan-400/25 bg-cyan-400/[0.06]",
  neutral: "border-white/10 bg-white/[0.03]",
} as const;

const DOT_TONES = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  info: "bg-cyan-400",
  neutral: "bg-slate-500",
} as const;

function Strip({
  tone,
  children,
}: {
  tone: keyof typeof STRIP_TONES;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur",
        STRIP_TONES[tone],
      )}
    >
      {children}
    </div>
  );
}

function StatusDot({ tone }: { tone: keyof typeof DOT_TONES }) {
  return (
    <span aria-hidden className="relative grid h-2.5 w-2.5 shrink-0 place-items-center">
      <span
        className={cx(
          "mn-animate-pulse-ring absolute inset-0 rounded-full",
          DOT_TONES[tone],
        )}
      />
      <span className={cx("h-2 w-2 rounded-full", DOT_TONES[tone])} />
    </span>
  );
}

function StripButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
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
