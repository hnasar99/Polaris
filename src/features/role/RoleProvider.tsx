"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isRole, type AppRole } from "@/features/role/roles";
import { createLocalStore, hydratedStore } from "@/lib/browserStore";

export type { AppRole } from "@/features/role/roles";

/** Shared across tabs, so signing out in one signs out everywhere. */
const roleStore = createLocalStore("polaris:role");

type RoleValue = {
  role: AppRole | null;
  /**
   * False until the stored role is readable on the client. Gates must wait for
   * this, otherwise the hydration pass — which has no role yet — bounces a
   * signed-in user back to the landing page.
   */
  hydrated: boolean;
  setRole: (role: AppRole | null) => void;
  /** Clear the role and return to the landing page's choice of entry points. */
  signOut: () => void;
};

const RoleContext = createContext<RoleValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(
    roleStore.subscribe,
    roleStore.getSnapshot,
    roleStore.getServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    hydratedStore.subscribe,
    hydratedStore.getSnapshot,
    hydratedStore.getServerSnapshot,
  );

  const role = isRole(stored) ? stored : null;

  const setRole = useCallback(
    (next: AppRole | null) => roleStore.set(next),
    [],
  );
  const signOut = useCallback(() => roleStore.set(null), []);

  const value = useMemo<RoleValue>(
    () => ({ role, hydrated, setRole, signOut }),
    [hydrated, role, setRole, signOut],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
