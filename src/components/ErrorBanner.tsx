"use client";

import { useAppState } from "@/features/app/AppStateProvider";

export function ErrorBanner() {
  const { globalError, clearGlobalError } = useAppState();
  if (!globalError) return null;

  return (
    <div
      className="border-b border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
      role="alert"
    >
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
        <div>
          <span className="font-medium">{globalError.message}</span>
          <span className="ml-2 text-rose-200/70">({globalError.code})</span>
        </div>
        <button
          type="button"
          onClick={clearGlobalError}
          className="shrink-0 text-rose-200/80 underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
