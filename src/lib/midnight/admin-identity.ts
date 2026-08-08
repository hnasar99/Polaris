/**
 * Local bookkeeping for the platform admin role.
 *
 * `adminPk` is `persistentHash("polaris:admin:pk:v1", sk)` computed inside the
 * circuit, so TypeScript cannot recompute it from the DApp secret. Instead we
 * remember which contracts this browser deployed and learn the pk from the
 * ledger afterwards. This is a UI hint only — `assertAdmin` in the contract is
 * the authority, and vault calls from any other browser fail on-chain.
 */

const DEPLOYED_KEY = "polaris:admin:contracts";
const ADMIN_PK_KEY = "polaris:admin:pk";

function readList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEPLOYED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberAdminContract(address: string): void {
  if (typeof window === "undefined" || !address) return;
  const list = readList();
  if (list.includes(address)) return;
  window.localStorage.setItem(DEPLOYED_KEY, JSON.stringify([...list, address]));
}

export function deployedByThisBrowser(address: string | null): boolean {
  if (!address) return false;
  return readList().includes(address);
}

export function getAdminPkHex(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_PK_KEY);
}

export function rememberAdminPk(pkHex: string): void {
  if (typeof window === "undefined" || !pkHex) return;
  window.localStorage.setItem(ADMIN_PK_KEY, pkHex);
}
