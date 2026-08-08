/**
 * Gate for Compact-generated Contract bindings.
 *
 * Generated output is produced by:
 *   npm run compact
 *   npm run sync:zk
 *
 * Set NEXT_PUBLIC_POLARIS_BINDINGS_READY=true only after
 * midnight/generated/polaris-health/contract exists and ZK assets are in
 * public/zk/polaris-health/.
 *
 * Never invent Contract shapes — only load compiler output.
 */

import {
  witnesses,
  type PolarisPrivateState,
} from "../../../midnight/contracts/witnesses";

export type { PolarisPrivateState };
export { witnesses };

export function isBindingsReadyFlag(): boolean {
  return process.env.NEXT_PUBLIC_POLARIS_BINDINGS_READY === "true";
}

export type LoadedPolarisBindings = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Contract class
  Contract: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compiledContract: any;
  /** Generated `ledger(contractState.data)` decoder, when the output exposes it. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ledger: ((data: any) => any) | null;
};

let cached: LoadedPolarisBindings | null | undefined;

/**
 * Returns null when bindings are not compiled / not flagged ready.
 * Uses webpackIgnore so Next can build before `compact compile`.
 */
export async function loadPolarisBindings(): Promise<LoadedPolarisBindings | null> {
  if (cached !== undefined) return cached;
  if (!isBindingsReadyFlag()) {
    cached = null;
    return null;
  }

  try {
    const compactJs = await import("@midnight-ntwrk/compact-js");
    // Variable path so TypeScript does not require compiler output at build time.
    // File exists only after `npm run compact`.
    const generatedPath =
      "../../../midnight/generated/polaris-health/contract/index.js";
    const generated: { Contract?: unknown; ledger?: unknown } = await import(
      /* webpackIgnore: true */
      generatedPath
    );

    const Contract = generated.Contract;
    if (!Contract) {
      cached = null;
      return null;
    }

    const zkPath =
      typeof window !== "undefined"
        ? "/zk/polaris-health"
        : "public/zk/polaris-health";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CC = compactJs.CompiledContract as any;
    const compiledContract = CC.make("polaris-health", Contract).pipe(
      CC.withWitnesses(witnesses),
      CC.withCompiledFileAssets(zkPath),
    );

    cached = {
      Contract,
      compiledContract,
      ledger:
        typeof generated.ledger === "function"
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (generated.ledger as (data: any) => any)
          : null,
    };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

/** Test helper — reset memoized bindings. */
export function resetBindingsCache(): void {
  cached = undefined;
}
