"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";
import { useRole } from "@/features/role/RoleProvider";
import { ROLE_DEFINITIONS, type AppRole } from "@/features/role/roles";
import { useI18n } from "@/i18n";

/**
 * Keeps each role inside its own screens.
 *
 * No role at all sends the visitor back to the landing page to pick one —
 * deliberately, so that opening /lab directly does not silently make you a
 * laboratory. A mismatched role is redirected to its own home instead.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: AppRole;
  children: ReactNode;
}) {
  const { role, hydrated } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || role === allow) return;
    router.replace(role === null ? "/" : ROLE_DEFINITIONS[role].home);
  }, [allow, hydrated, role, router]);

  if (role !== allow) return <RoleGatePending />;
  return <>{children}</>;
}

function RoleGatePending() {
  const { t } = useI18n();

  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-sm text-slate-400">
        <Spinner />
        {t("common.loading")}
      </p>
    </div>
  );
}
