"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { useWallet } from "@/features/wallet/WalletProvider";
import { errorMessageKey, useI18n } from "@/i18n";

export function ErrorBanner() {
  const { error, setError, selectedNetwork } = useWallet();
  const { t } = useI18n();
  if (!error) return null;

  return (
    <div
      role="alert"
      className="border-b border-rose-400/30 bg-rose-500/10 px-4 py-2"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <p className="min-w-0 flex-1 text-sm text-rose-100">
          {/* The provider raises a machine code; the wording is chosen here. */}
          {t(errorMessageKey(error.code), { network: selectedNetwork })}
        </p>
        <Button variant="ghost" onClick={() => setError(null)}>
          {t("common.dismiss")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Shown while the Compact output is missing: on-chain calls fail on purpose
 * instead of faking success, so the UI has to say why.
 */
/**
 * Laboratory views publish on-chain through the platform session bound in the
 * admin console — not through a lab wallet connect UI.
 */
export function PlatformSetupNotice() {
  const { t } = useI18n();
  const { contractAddress, walletConnected, bindingsReady } = useWallet();

  if (!bindingsReady) return null;

  if (!contractAddress) {
    return (
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
        <p className="text-sm text-amber-100">{t("lab.platformNoContract")}</p>
        <Link
          href="/admin"
          className="mt-2 inline-block text-sm font-semibold text-amber-200 underline-offset-2 hover:underline"
        >
          {t("lab.platformAdminLink")}
        </Link>
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
        <p className="text-sm text-amber-100">{t("lab.platformNoSession")}</p>
        <Link
          href="/admin"
          className="mt-2 inline-block text-sm font-semibold text-amber-200 underline-offset-2 hover:underline"
        >
          {t("lab.platformAdminLink")}
        </Link>
      </div>
    );
  }

  return null;
}

export function SetupNotice() {
  const { bindingsReady } = useWallet();
  const { t } = useI18n();
  if (bindingsReady) return null;

  const steps = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

  return (
    <details className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-amber-100">
        {t("setup.title")}
      </summary>
      <p className="mt-2 text-sm text-amber-100/80">{t("setup.body")}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-amber-100/70">
        {steps.map((step) => (
          <li key={step}>{t(`setup.${step}`)}</li>
        ))}
      </ol>
    </details>
  );
}
