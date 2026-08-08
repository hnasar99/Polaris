/**
 * Local bookkeeping for the platform admin role.
 *
 * `adminPk` is `persistentHash("polaris:admin:pk:v1", sk)` computed inside the
 * circuit, so TypeScript cannot recompute it from the DApp secret. Instead we
 * remember which contracts this browser deployed and learn the pk from the
 * ledger afterwards. This is a UI hint only — `assertAdmin` in the contract is
 * the authority, and vault calls from any other browser fail on-chain.
 */

import { getMidnightNetworkId } from "@/lib/wallet/network";

const DEPLOYED_KEY = "polaris:admin:contracts";
const ADMIN_PK_KEY = "polaris:admin:pk";

export type AdminContractSource = "deploy" | "join";

export type AdminContractRecord = {
  address: string;
  networkId: string;
  deployedAt: string;
  source: AdminContractSource;
};

export type RememberAdminContractMeta = {
  networkId: string;
  source: AdminContractSource;
};

function isRecord(value: unknown): value is AdminContractRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.address === "string" &&
    typeof row.networkId === "string" &&
    typeof row.deployedAt === "string" &&
    (row.source === "deploy" || row.source === "join")
  );
}

function writeRecords(records: AdminContractRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEPLOYED_KEY, JSON.stringify(records));
}

function readRecords(): AdminContractRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEPLOYED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    let migrated = false;
    const records: AdminContractRecord[] = [];

    for (const item of parsed) {
      if (typeof item === "string" && item.length > 0) {
        records.push({
          address: item,
          networkId: getMidnightNetworkId(),
          deployedAt: "",
          source: "deploy",
        });
        migrated = true;
        continue;
      }
      if (isRecord(item)) {
        records.push(item);
      }
    }

    if (migrated) {
      writeRecords(records);
    }

    return records;
  } catch {
    return [];
  }
}

export function listAdminContracts(): AdminContractRecord[] {
  return [...readRecords()].sort((a, b) => {
    const aTime = Date.parse(a.deployedAt);
    const bTime = Date.parse(b.deployedAt);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    if (Number.isFinite(aTime) && !Number.isFinite(bTime)) return -1;
    if (!Number.isFinite(aTime) && Number.isFinite(bTime)) return 1;
    return b.address.localeCompare(a.address);
  });
}

export function rememberAdminContract(
  address: string,
  meta: RememberAdminContractMeta,
): void {
  if (typeof window === "undefined" || !address) return;
  const trimmed = address.trim();
  if (!trimmed) return;

  const list = readRecords();
  if (list.some((row) => row.address === trimmed)) return;

  writeRecords([
    ...list,
    {
      address: trimmed,
      networkId: meta.networkId,
      deployedAt: new Date().toISOString(),
      source: meta.source,
    },
  ]);
}

export function deployedByThisBrowser(address: string | null): boolean {
  if (!address) return false;
  return readRecords().some((row) => row.address === address);
}

export function getAdminPkHex(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_PK_KEY);
}

export function rememberAdminPk(pkHex: string): void {
  if (typeof window === "undefined" || !pkHex) return;
  window.localStorage.setItem(ADMIN_PK_KEY, pkHex);
}
