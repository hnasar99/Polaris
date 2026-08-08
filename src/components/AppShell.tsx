"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ErrorBanner } from "@/components/Banners";
import { useI18n } from "@/i18n";

const MAIN_ID = "main";

/**
 * The landing page is full-bleed; every signed-in route sits in the app
 * container. Layout is a server component and cannot read the pathname, so the
 * decision lives here.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isLanding = pathname === "/";

  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        {t("landing.skipToContent")}
      </a>
      <ErrorBanner />
      <AppNav />
      <main
        id={MAIN_ID}
        className={isLanding ? undefined : "mx-auto max-w-5xl px-4 py-6 sm:py-8"}
      >
        {children}
      </main>
    </>
  );
}
