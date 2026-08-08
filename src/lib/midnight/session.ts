/**
 * 1AM / DApp Connector session — prove → balance → submit (dust-free).
 * Patterns from 1am-wallet + example-payment-dapp skills.
 */

import { ContractState } from "@midnight-ntwrk/compact-runtime";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type {
  MidnightProvider,
  WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import {
  POLARIS_PRIVATE_STATE_ID,
  POLARIS_ZK_ASSET_PATH,
} from "@/lib/midnight/constants";
import { fromHex, toHex } from "@/lib/midnight/encoding";

export { POLARIS_PRIVATE_STATE_ID, POLARIS_ZK_ASSET_PATH };

export type ConnectedSession = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wallet ConnectedAPI surface
  api: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- wallet configuration blob
  config: any;
  providers: {
    privateStateProvider: ReturnType<typeof createPrivateStateProvider>;
    publicDataProvider: ReturnType<typeof createPatchedPublicDataProvider>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic
    zkConfigProvider: FetchZkConfigProvider<any>;
    proofProvider: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proveTx: (unprovenTx: any, _config?: any) => Promise<any>;
    };
    walletProvider: WalletProvider;
    midnightProvider: MidnightProvider;
  };
  unshieldedAddress: string;
  coinPublicKeyBytes: Uint8Array;
};

export function coinPublicKeyToBytes(pk: unknown): Uint8Array {
  if (pk instanceof Uint8Array) {
    return pk.length === 32 ? pk : pk.slice(0, 32);
  }
  if (typeof pk === "string") {
    const hex = pk.startsWith("0x") ? pk.slice(2) : pk;
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
      return fromHex(hex);
    }
    return new Uint8Array(32);
  }
  if (Array.isArray(pk)) {
    const arr = pk as number[];
    return new Uint8Array(
      arr.length >= 32 ? arr.slice(0, 32) : [...arr, ...new Array(32 - arr.length).fill(0)],
    );
  }
  if (pk && typeof pk === "object" && "bytes" in (pk as object)) {
    return coinPublicKeyToBytes((pk as { bytes: unknown }).bytes);
  }
  return new Uint8Array(32);
}

export function createPrivateStateProvider() {
  let scope = "";
  const stateStore = new Map<string, unknown>();
  const signingKeyStore = new Map<string, unknown>();
  const key = (id: string) => `${scope}:${id}`;

  return {
    setContractAddress(address: string) {
      scope = address;
    },
    async set(id: string, value: unknown) {
      stateStore.set(key(id), value);
    },
    async get(id: string) {
      return stateStore.get(key(id)) ?? null;
    },
    async remove(id: string) {
      stateStore.delete(key(id));
    },
    async clear() {
      stateStore.clear();
    },
    async setSigningKey(addr: string, k: unknown) {
      signingKeyStore.set(addr, k);
    },
    async getSigningKey(addr: string) {
      return signingKeyStore.get(addr) ?? null;
    },
    async removeSigningKey(addr: string) {
      signingKeyStore.delete(addr);
    },
    async clearSigningKeys() {
      signingKeyStore.clear();
    },
    async exportPrivateStates(): Promise<never> {
      throw new Error("Not implemented.");
    },
    async importPrivateStates(): Promise<never> {
      throw new Error("Not implemented.");
    },
    async exportSigningKeys(): Promise<never> {
      throw new Error("Not implemented.");
    },
    async importSigningKeys(): Promise<never> {
      throw new Error("Not implemented.");
    },
  };
}

/**
 * Indexer workaround: preview/preprod break on offset:null in default SDK queries.
 */
export function createPatchedPublicDataProvider(
  queryUrl: string,
  subscriptionUrl: string,
) {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);

  return {
    ...base,
    async queryContractState(contractAddress: string, config?: unknown) {
      if (config) {
        return base.queryContractState(
          contractAddress,
          config as Parameters<typeof base.queryContractState>[1],
        );
      }

      const res = await fetch(queryUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `query LATEST_CONTRACT_STATE($address: HexEncoded!) {
            contractAction(address: $address) { state }
          }`,
          variables: { address: contractAddress },
        }),
      });
      if (!res.ok) {
        throw new Error(`Indexer HTTP error: ${res.status}`);
      }
      const payload = (await res.json()) as {
        errors?: { message: string }[];
        data?: { contractAction?: { state: string } | null };
      };
      if (payload.errors?.length) {
        throw new Error(payload.errors.map((e) => e.message).join("; "));
      }
      const action = payload.data?.contractAction ?? null;
      return action ? ContractState.deserialize(fromHex(action.state)) : null;
    },
  };
}

export async function createConnectedSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ConnectedAPI from extension
  api: any,
  zkAssetBasePath: string = POLARIS_ZK_ASSET_PATH,
): Promise<ConnectedSession> {
  const [config, unshieldedAddress, shieldedAddress] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
  ]);

  setNetworkId(config.networkId);

  const zkConfigProvider = new FetchZkConfigProvider(
    new URL(zkAssetBasePath, window.location.origin).toString(),
    window.fetch.bind(window),
  );

  const provingProvider = await api.getProvingProvider(zkConfigProvider);

  const proofProvider = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async proveTx(unprovenTx: any, _config?: any) {
      const { CostModel } = await import("@midnight-ntwrk/ledger-v8");
      return unprovenTx.prove(provingProvider, CostModel.initialCostModel());
    },
  };

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shieldedAddress.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddress.shieldedEncryptionPublicKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    balanceTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const balanced = await api.balanceUnsealedTransaction(txHex);
      if (!balanced?.tx) {
        throw new Error("balanceUnsealedTransaction returned invalid result");
      }
      const { Transaction } = await import("@midnight-ntwrk/ledger-v8");
      return Transaction.deserialize(
        "signature",
        "proof",
        "binding",
        fromHex(balanced.tx),
      );
    },
  };

  const midnightProvider: MidnightProvider = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const result = await api.submitTransaction(txHex);
      if (typeof result === "string" && result) return result;
      if (result?.transactionId) return result.transactionId;
      if (result?.id) return result.id;
      return txHex.slice(0, 64);
    },
  };

  return {
    api,
    config,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider: createPatchedPublicDataProvider(
        config.indexerUri,
        config.indexerWsUri,
      ),
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    unshieldedAddress: unshieldedAddress.unshieldedAddress,
    coinPublicKeyBytes: coinPublicKeyToBytes(
      shieldedAddress.shieldedCoinPublicKey,
    ),
  };
}
