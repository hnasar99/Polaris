/**
 * Deploy / call helpers for polaris-health Compact circuits.
 * Uses low-level createUnproven* + submitTxAsync (avoids preprod hang).
 */

import type { PolarisPrivateState } from "@/lib/midnight/bindings";
import { loadPolarisBindings } from "@/lib/midnight/bindings";
import { POLARIS_PRIVATE_STATE_ID } from "@/lib/midnight/constants";
import type { ConnectedSession } from "@/lib/midnight/session";
import { MidnightAdapterError } from "@/lib/midnight/errors";
import {
  createDeployProgressTracker,
  type DeployProgressCallback,
} from "@/lib/midnight/deploy-progress";

export type CircuitCallResult = {
  transactionId: string;
  /** Circuit return value when present (e.g. proveEligibility Boolean). */
  result?: unknown;
};

function extractTxId(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.transactionId === "string") return obj.transactionId;
    if (typeof obj.txId === "string") return obj.txId;
    if (typeof obj.txHash === "string") return obj.txHash;
    const pub = obj.public as Record<string, unknown> | undefined;
    if (pub) {
      if (typeof pub.txHash === "string") return pub.txHash;
      if (typeof pub.txId === "string") return pub.txId;
      if (typeof pub.transactionId === "string") return pub.transactionId;
    }
  }
  return `midnight_tx_${Date.now().toString(36)}`;
}

function extractCircuitResult(value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  if ("result" in obj) return obj.result;
  const pub = obj.public as Record<string, unknown> | undefined;
  if (pub && "result" in pub) return pub.result;
  const priv = obj.private as Record<string, unknown> | undefined;
  if (priv && "result" in priv) return priv.result;
  return undefined;
}

async function requireCompiledContract() {
  const bindings = await loadPolarisBindings();
  if (!bindings) {
    throw new MidnightAdapterError(
      "MIDNIGHT_BINDINGS_MISSING",
      "Compact bindings missing — run npm run compact && npm run sync:zk, then set NEXT_PUBLIC_POLARIS_BINDINGS_READY=true",
    );
  }
  return bindings.compiledContract;
}

export async function persistPrivateState(
  session: ConnectedSession,
  contractAddress: string,
  privateState: PolarisPrivateState,
): Promise<void> {
  await session.providers.privateStateProvider.setContractAddress(
    contractAddress,
  );
  await session.providers.privateStateProvider.set(
    POLARIS_PRIVATE_STATE_ID,
    privateState,
  );
}

export async function deployPolarisHealth(
  session: ConnectedSession,
  adminSecret: Uint8Array,
  onProgress?: DeployProgressCallback,
): Promise<string> {
  const tracker = onProgress
    ? createDeployProgressTracker(onProgress)
    : null;

  const compiledContract = tracker
    ? await tracker.run(
        "bindings",
        () => requireCompiledContract(),
        "Loading Compact bindings…",
        "Bindings loaded",
      )
    : await requireCompiledContract();

  const { createUnprovenDeployTx, submitTxAsync } = await import(
    "@midnight-ntwrk/midnight-js-contracts"
  );
  const { sampleSigningKey } = await import("@midnight-ntwrk/compact-runtime");

  const initialPrivateState: PolarisPrivateState = {
    localSecretKey: adminSecret,
    age: 0,
    diagnosis: "",
    hba1cScaled: 0,
    treatment: "",
    treatmentMonths: 0,
  };

  const deployTxData = tracker
    ? await tracker.run(
        "createTx",
        async () =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (createUnprovenDeployTx as any)(
            {
              zkConfigProvider: session.providers.zkConfigProvider,
              walletProvider: session.providers.walletProvider,
            },
            {
              compiledContract,
              args: [adminSecret],
              privateStateId: POLARIS_PRIVATE_STATE_ID,
              initialPrivateState,
              signingKey: sampleSigningKey(),
            },
          ),
        "Creating unproven deploy transaction…",
      )
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (createUnprovenDeployTx as any)(
        {
          zkConfigProvider: session.providers.zkConfigProvider,
          walletProvider: session.providers.walletProvider,
        },
        {
          compiledContract,
          args: [adminSecret],
          privateStateId: POLARIS_PRIVATE_STATE_ID,
          initialPrivateState,
          signingKey: sampleSigningKey(),
        },
      );

  const contractAddress = deployTxData.public.contractAddress as string;
  tracker?.log("info", `Contract address: ${contractAddress}`);

  if (tracker) {
    await tracker.run(
      "submit",
      async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (submitTxAsync as any)(session.providers, {
          unprovenTx: deployTxData.private.unprovenTx,
        }),
      "Proving and submitting via wallet…",
      "Transaction submitted",
    );
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (submitTxAsync as any)(session.providers, {
      unprovenTx: deployTxData.private.unprovenTx,
    });
  }

  if (tracker) {
    await tracker.run(
      "persist",
      async () => {
        await session.providers.privateStateProvider.setContractAddress(
          contractAddress,
        );
        await session.providers.privateStateProvider.set(
          POLARIS_PRIVATE_STATE_ID,
          initialPrivateState,
        );
        await session.providers.privateStateProvider.setSigningKey(
          contractAddress,
          deployTxData.private.signingKey,
        );
      },
      "Persisting private state…",
      "Private state saved",
    );
  } else {
    await session.providers.privateStateProvider.setContractAddress(
      contractAddress,
    );
    await session.providers.privateStateProvider.set(
      POLARIS_PRIVATE_STATE_ID,
      initialPrivateState,
    );
    await session.providers.privateStateProvider.setSigningKey(
      contractAddress,
      deployTxData.private.signingKey,
    );
  }

  return contractAddress;
}

export async function callPolarisCircuit(
  session: ConnectedSession,
  contractAddress: string,
  circuitId: string,
  args: unknown[],
  privateState: PolarisPrivateState,
): Promise<CircuitCallResult> {
  const compiledContract = await requireCompiledContract();
  await persistPrivateState(session, contractAddress, privateState);

  const { createUnprovenCallTx, submitTxAsync } = await import(
    "@midnight-ntwrk/midnight-js-contracts"
  );

  // Prefer submitCallTxAsync when available; fall back to createUnprovenCallTx + submitTxAsync.
  try {
    const contracts = await import("@midnight-ntwrk/midnight-js-contracts");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submitCallTxAsync = (contracts as any).submitCallTxAsync;
    if (typeof submitCallTxAsync === "function") {
      const result = await submitCallTxAsync(session.providers, {
        compiledContract,
        contractAddress,
        circuitId,
        args,
        privateStateId: POLARIS_PRIVATE_STATE_ID,
      });
      return {
        transactionId: extractTxId(result),
        result: extractCircuitResult(result),
      };
    }
  } catch {
    // fall through
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callTxData = await (createUnprovenCallTx as any)(session.providers, {
    compiledContract,
    contractAddress,
    circuitId,
    args,
    privateStateId: POLARIS_PRIVATE_STATE_ID,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txId = await (submitTxAsync as any)(session.providers, {
    unprovenTx: callTxData.private.unprovenTx,
    circuitId,
  });

  return {
    transactionId: extractTxId(txId ?? callTxData),
    result: extractCircuitResult(callTxData),
  };
}
