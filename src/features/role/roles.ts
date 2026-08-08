/**
 * Single source of truth for the roles the app can be entered as.
 *
 * Kept free of React and of any Midnight import so both client components and
 * plain modules can read it without dragging WASM into their bundle.
 */

import type { MessageKey } from "@/i18n/keys";

export type AppRole = "patient" | "lab" | "admin";

export type RoleDefinition = {
  role: AppRole;
  /** Landing route for the role. Also where the gate sends a mismatched role. */
  home: string;
  /** i18n keys — the registry stores keys, never rendered strings. */
  nameKey: MessageKey;
  descKey: MessageKey;
  ctaKey: MessageKey;
  navKey: MessageKey;
};

export const ROLES = ["patient", "lab", "admin"] as const satisfies readonly AppRole[];

/**
 * The two roles offered as login paths on the landing page. `admin` is an
 * operational console reached from the footer, not a sign-up path.
 */
export const LOGIN_ROLES = ["patient", "lab"] as const satisfies readonly AppRole[];

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  patient: {
    role: "patient",
    home: "/patient",
    nameKey: "roles.patient",
    descKey: "roles.patientDesc",
    ctaKey: "roles.enterPatient",
    navKey: "nav.matches",
  },
  lab: {
    role: "lab",
    home: "/lab",
    nameKey: "roles.lab",
    descKey: "roles.labDesc",
    ctaKey: "roles.enterLab",
    navKey: "nav.lab",
  },
  admin: {
    role: "admin",
    home: "/admin",
    nameKey: "roles.admin",
    descKey: "roles.adminDesc",
    ctaKey: "roles.enterAdmin",
    navKey: "nav.admin",
  },
};

export function isRole(value: unknown): value is AppRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Where a signed-in role belongs; the landing page when there is no role. */
export function homeForRole(role: AppRole | null): string {
  return role ? ROLE_DEFINITIONS[role].home : "/";
}
