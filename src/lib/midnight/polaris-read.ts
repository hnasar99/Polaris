/**
 * Read public polaris-health ledger state through the indexer.
 *
 * Everything returned here is already public on-chain: study criteria, the
 * platform vault balance and aggregate counters. No consent key, nullifier or
 * medical value is ever resolved back to a person.
 */

import { loadPolarisBindings } from "@/lib/midnight/bindings";
import { toHex } from "@/lib/midnight/encoding";
import type { ConnectedSession } from "@/lib/midnight/session";

export type OnChainCriteria = {
  minAge: number;
  requiredDiagnosis: string;
  minHba1cScaled: number;
  requiredTreatment: string;
  minTreatmentMonths: number;
};

export type OnChainStudy = {
  studyIdHex: string;
  criteria: OnChainCriteria;
  /** Reward per participant, in Stars. */
  rewardStars: bigint;
  active: boolean;
  researcherPkHex: string;
  /** Vault money already paid to this study's participants, in Stars. */
  spentStars: bigint;
  eligibleCount: number;
  consentCount: number;
  claimCount: number;
};

export type PolarisLedgerView = {
  adminPkHex: string;
  studies: OnChainStudy[];
  studyCount: number;
  eligibilityProofCount: number;
  consentGrantCount: number;
  rewardClaimCount: number;
  /** Liquidity currently held by the platform vault, in Stars. */
  vaultBalanceStars: bigint;
  totalFundedStars: bigint;
  totalPaidStars: bigint;
};

const TEXT_DECODER = new TextDecoder();

/** Inverse of Compact pad(32, str): drop zero padding, decode UTF-8. */
export function decodeCode(value: unknown): string {
  const bytes = toBytes(value);
  if (!bytes) return "";
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end -= 1;
  return TEXT_DECODER.decode(bytes.subarray(0, end));
}

function toBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) return new Uint8Array(value as number[]);
  if (value && typeof value === "object" && "bytes" in (value as object)) {
    return toBytes((value as { bytes: unknown }).bytes);
  }
  return null;
}

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.length > 0) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Counter ledger fields expose .value in some SDK versions.
    if ("value" in obj) return toBigInt(obj.value);
    if (typeof obj.toBigInt === "function") {
      return (obj.toBigInt as () => bigint)();
    }
  }
  return 0n;
}

function toNumber(value: unknown): number {
  return Number(toBigInt(value));
}

function hexOf(value: unknown): string {
  const bytes = toBytes(value);
  return bytes ? toHex(bytes) : "";
}

/** Iterate a generated Map ledger field regardless of SDK iteration shape. */
function mapEntries(field: unknown): Array<[unknown, unknown]> {
  if (!field) return [];
  const candidate = field as {
    [Symbol.iterator]?: () => Iterator<[unknown, unknown]>;
    entries?: () => Iterable<[unknown, unknown]>;
  };
  if (typeof candidate[Symbol.iterator] === "function") {
    return Array.from(field as Iterable<[unknown, unknown]>);
  }
  if (typeof candidate.entries === "function") {
    return Array.from(candidate.entries());
  }
  return [];
}

function decodeStudy(key: unknown, record: unknown): OnChainStudy {
  const r = (record ?? {}) as Record<string, unknown>;
  const criteria = (r.criteria ?? {}) as Record<string, unknown>;

  return {
    studyIdHex: hexOf(key),
    criteria: {
      minAge: toNumber(criteria.minAge),
      requiredDiagnosis: decodeCode(criteria.requiredDiagnosis),
      minHba1cScaled: toNumber(criteria.minHba1cScaled),
      requiredTreatment: decodeCode(criteria.requiredTreatment),
      minTreatmentMonths: toNumber(criteria.minTreatmentMonths),
    },
    rewardStars: toBigInt(r.rewardAmount),
    active: Boolean(r.active),
    researcherPkHex: hexOf(r.researcherPk),
    spentStars: toBigInt(r.spent),
    eligibleCount: toNumber(r.eligibleCount),
    consentCount: toNumber(r.consentCount),
    claimCount: toNumber(r.claimCount),
  };
}

/**
 * Fetch and decode the whole public ledger.
 * Returns null when the contract has no state yet or bindings are unavailable.
 */
export async function readPolarisLedger(
  session: ConnectedSession,
  contractAddress: string,
): Promise<PolarisLedgerView | null> {
  const bindings = await loadPolarisBindings();
  if (!bindings?.ledger) return null;

  const state =
    await session.providers.publicDataProvider.queryContractState(
      contractAddress,
    );
  if (!state) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = bindings.ledger((state as any).data);

  return {
    adminPkHex: hexOf(l.adminPk),
    studies: mapEntries(l.studies).map(([key, value]) =>
      decodeStudy(key, value),
    ),
    studyCount: toNumber(l.studyCount),
    eligibilityProofCount: toNumber(l.eligibilityProofCount),
    consentGrantCount: toNumber(l.consentGrantCount),
    rewardClaimCount: toNumber(l.rewardClaimCount),
    vaultBalanceStars: toBigInt(l.vaultBalance),
    totalFundedStars: toBigInt(l.totalFunded),
    totalPaidStars: toBigInt(l.totalPaid),
  };
}

/** Poll until the ledger satisfies a predicate (post-submit confirmation). */
export async function pollForLedger(
  session: ConnectedSession,
  contractAddress: string,
  isReady: (view: PolarisLedgerView) => boolean,
  attempts = 20,
  intervalMs = 1500,
): Promise<PolarisLedgerView | null> {
  let last: PolarisLedgerView | null = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await readPolarisLedger(session, contractAddress);
    if (last && isReady(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return last;
}
