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
 *
 * The Contract module is resolved via the `@polaris/health-contract` webpack
 * alias (real generated file, or `contract-stub.js` before compile). Do not use
 * `webpackIgnore` — that becomes a browser network fetch and 404s.
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
 * Dynamic import keeps Compact/WASM out of the eager client graph.
 */
export async function loadPolarisBindings(): Promise<LoadedPolarisBindings | null> {
  if (cached !== undefined) return cached;
  if (!isBindingsReadyFlag()) {
    cached = null;
    return null;
  }

  try {
    const [compactJs, generated] = await Promise.all([
      import("@midnight-ntwrk/compact-js"),
      import("@polaris/health-contract"),
    ]);

    const Contract = (generated as { Contract?: unknown }).Contract;
    if (!Contract) {
      // Stub is aliased when midnight/generated/.../contract is missing from the build.
      console.error(
        "[polaris] Compact Contract export missing — generated bindings were not included in this build (run npm run compact && npm run sync:zk locally; ensure contract + public/zk are present for deploys).",
      );
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

    const ledgerFn = (generated as { ledger?: unknown }).ledger;
    cached = {
      Contract,
      compiledContract,
      ledger:
        typeof ledgerFn === "function"
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ledgerFn as (data: any) => any)
          : null,
    };
    return cached;
  } catch (err) {
    console.error("[polaris] Failed to load Compact bindings", err);
    cached = null;
    return null;
  }
}

/** Test helper — reset memoized bindings. */
export function resetBindingsCache(): void {
  cached = undefined;
}
