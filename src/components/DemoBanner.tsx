"use client";

import { useAppState } from "@/features/app/AppStateProvider";

export function DemoBanner() {
  const { demoMode } = useAppState();
  if (!demoMode) return null;

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-100"
      role="status"
    >
      <strong className="font-semibold tracking-wide">
        DEMO PRIVACY ENGINE
      </strong>
      <span className="mx-2 text-amber-200/80">·</span>
      Local evaluation only — not a ZK proof verified on Midnight.
    </div>
  );
}
