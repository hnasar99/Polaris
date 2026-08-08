"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cx } from "@/components/ui";
import { useRole } from "@/features/role/RoleProvider";
import { ROLE_DEFINITIONS, homeForRole } from "@/features/role/roles";
import { useWallet } from "@/features/wallet/WalletProvider";
import { useI18n } from "@/i18n";
import { truncateAddress } from "@/lib/format";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { role, signOut } = useRole();
  const {
    walletAddress,
    walletConnected,
    walletStatus,
    connect,
    disconnect,
    isConnecting,
  } = useWallet();

  const definition = role ? ROLE_DEFINITIONS[role] : null;
  const onLanding = pathname === "/";

  const handleSignOut = async () => {
    signOut();
    await disconnect();
    router.push("/");
  };

  return (
    <header
      className={cx(
        "sticky top-0 z-40 border-b backdrop-blur",
        onLanding
          ? "border-white/5 bg-[#050b14]/70"
          : "border-cyan-500/15 bg-[#07111f]/90",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        <Link
          href={homeForRole(role)}
          aria-label={t("nav.brandHome")}
          className="mr-auto flex min-w-0 items-center gap-2.5"
        >
          <BrandMark />
          <span className="min-w-0">
            <span className="block text-base font-semibold tracking-tight text-white">
              {t("common.appName")}
            </span>
            <span className="block truncate text-xs text-slate-400">
              {definition ? t(definition.nameKey) : t("common.tagline")}
            </span>
          </span>
        </Link>

        {definition ? (
          <nav
            aria-label={t("roles.menu")}
            className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto"
          >
            <Link
              href={definition.home}
              aria-current={pathname === definition.home ? "page" : undefined}
              className={cx(
                "rounded-lg px-3 py-1.5 text-sm transition",
                pathname === definition.home
                  ? "bg-cyan-500/15 font-medium text-cyan-200"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              {t(definition.navKey)}
            </Link>
            <RoleMenu onSignOut={handleSignOut} />
          </nav>
        ) : null}

        {walletConnected && walletAddress ? (
          <button
            type="button"
            onClick={() => void disconnect()}
            title={`${walletAddress} — ${t("wallet.disconnect")}`}
            className="rounded-lg bg-emerald-400/10 px-2.5 py-1 font-mono text-xs text-emerald-200 ring-1 ring-inset ring-emerald-400/20 transition hover:bg-emerald-400/15"
          >
            {truncateAddress(walletAddress)}
          </button>
        ) : walletStatus === "not-found" ? (
          <span
            title={t("wallet.install")}
            className="rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-400/20"
          >
            {t("wallet.notFound")}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={isConnecting || walletStatus === "checking"}
            className="rounded-lg bg-cyan-400/90 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
          </button>
        )}

        <LanguageToggle />
      </div>
    </header>
  );
}

function RoleMenu({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useI18n();
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!role) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        {t(ROLE_DEFINITIONS[role].nameKey)}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={cx("h-3 w-3 transition-transform", open && "rotate-180")}
        >
          <path
            d="M2 4.5 6 8.5 10 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0b1628] p-1 shadow-2xl shadow-black/50"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t("roles.active")}
          </p>
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            {t("roles.switch")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/10"
          >
            {t("roles.signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400/25 to-indigo-500/20 ring-1 ring-inset ring-cyan-300/30"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-cyan-200">
        <path
          d="M12 3.2 5 6.1v5.2c0 4.3 2.9 8.3 7 9.5 4.1-1.2 7-5.2 7-9.5V6.1L12 3.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v6M9 12h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
