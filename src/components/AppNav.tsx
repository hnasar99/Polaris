"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/vault", label: "Health Vault" },
  { href: "/studies", label: "Studies" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/researcher", label: "Researcher" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-cyan-500/15 bg-[#07111f]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/vault" className="text-lg font-semibold tracking-tight text-white">
            Polaris
          </Link>
          <p className="text-xs text-slate-400">
            Privacy-preserving research matching
          </p>
        </div>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "rounded-md bg-cyan-500/15 px-3 py-1.5 text-sm font-medium text-cyan-200"
                    : "rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
