"use client";

import { Button, Spinner, cx } from "@/components/ui";
import { useI18n } from "@/i18n";

/** Compact update control for on-demand balance / ledger refreshes. */
export function RefreshIconButton({
  onClick,
  refreshing,
  className,
}: {
  onClick: () => void | Promise<void>;
  refreshing?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const label = refreshing ? t("common.refreshing") : t("common.refresh");

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={refreshing}
      aria-label={label}
      title={label}
      onClick={() => void onClick()}
      className={cx("!px-2.5 !py-2", className)}
    >
      {refreshing ? (
        <Spinner />
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      )}
    </Button>
  );
}
