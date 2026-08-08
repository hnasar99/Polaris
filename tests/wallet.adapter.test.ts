import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWalletAdapter } from "@/lib/wallet/factory";
import { MidnightDappConnectorAdapter } from "@/lib/wallet/MidnightDappConnectorAdapter";
import { UnconnectedWalletAdapter } from "@/lib/wallet/UnconnectedWalletAdapter";
import {
  WALLET_EXTENSION_MISSING,
  WALLET_NOT_CONNECTED,
  WALLET_SUBMIT_NOT_WIRED,
  WalletAdapterError,
} from "@/lib/wallet/errors";
import { listWallets, selectWallet } from "@/lib/wallet/selectWallet";

vi.mock("@/lib/midnight/session", () => ({
  POLARIS_ZK_ASSET_PATH: "/zk/polaris-health",
  POLARIS_PRIVATE_STATE_ID: "PolarisPrivateState",
  createConnectedSession: vi.fn(async () => ({
    api: {},
    config: {
      networkId: "preprod",
      indexerUri: "https://example.test/graphql",
      indexerWsUri: "wss://example.test/graphql/ws",
    },
    providers: {},
    unshieldedAddress: "mn_unshielded_test_addr",
    coinPublicKeyBytes: new Uint8Array(32),
  })),
}));

vi.mock("@/lib/midnight/runtime", () => ({
  setMidnightSession: vi.fn(),
  setMidnightDappSecret: vi.fn(),
  clearMidnightRuntime: vi.fn(),
  getMidnightRuntime: vi.fn(() => ({})),
  loadPersistedContractAddress: vi.fn(() => null),
  setMidnightContractAddress: vi.fn(),
}));

vi.mock("@/lib/midnight/secret", () => ({
  getOrCreateDappSecret: vi.fn(() => new Uint8Array(32)),
}));

type MidnightWindow = {
  midnight?: Record<string, { name: string; connect: ReturnType<typeof vi.fn> }>;
};

describe("WalletAdapter stubs", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { midnight: undefined } satisfies MidnightWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("UnconnectedWalletAdapter rejects connect / signAndSubmit", async () => {
    const wallet = new UnconnectedWalletAdapter();
    expect(wallet.kind).toBe("unconnected");
    expect(wallet.isConnected()).toBe(false);
    expect(wallet.getAddress()).toBeNull();
    await expect(wallet.connect()).rejects.toThrow(WALLET_NOT_CONNECTED);
    await expect(wallet.signAndSubmit({})).rejects.toThrow(WALLET_NOT_CONNECTED);
  });

  it("MidnightDappConnectorAdapter starts unconnected and refuses silent submit", async () => {
    const wallet = new MidnightDappConnectorAdapter();
    expect(wallet.kind).toBe("dapp-connector");
    expect(wallet.isConnected()).toBe(false);
    expect(wallet.getAddress()).toBeNull();
    await expect(wallet.signAndSubmit({})).rejects.toBeInstanceOf(
      WalletAdapterError,
    );
    await expect(wallet.signAndSubmit({})).rejects.toMatchObject({
      code: WALLET_NOT_CONNECTED,
      message: WALLET_NOT_CONNECTED,
    });
  });

  it("createWalletAdapter always returns the real DApp Connector adapter", () => {
    const wallet = createWalletAdapter();
    expect(wallet).toBeInstanceOf(MidnightDappConnectorAdapter);
    expect(wallet.kind).toBe("dapp-connector");
    expect(wallet.isConnected()).toBe(false);
  });

  it("listWallets uses Object.values(window.midnight), not hardcoded lace keys", () => {
    const api = {
      name: "1AM",
      connect: vi.fn(),
    };
    (window as MidnightWindow).midnight = {
      "550e8400-e29b-41d4-a716-446655440000": api,
    };
    expect(listWallets()).toEqual([api]);
    expect(selectWallet().name).toBe("1AM");
  });

  it("selectWallet throws when no extension is injected", () => {
    (window as MidnightWindow).midnight = undefined;
    expect(() => selectWallet()).toThrow(WALLET_EXTENSION_MISSING);
  });

  it("MidnightDappConnectorAdapter rejects when extension missing", async () => {
    (window as MidnightWindow).midnight = undefined;
    const wallet = new MidnightDappConnectorAdapter();
    await expect(wallet.connect("preprod")).rejects.toThrow(
      WALLET_EXTENSION_MISSING,
    );
  });

  it("MidnightDappConnectorAdapter connects via InitialAPI and refuses fake ZK submit", async () => {
    const connectedApi = {
      getUnshieldedAddress: vi.fn(async () => ({
        unshieldedAddress: "mn_unshielded_test_addr",
      })),
      getConfiguration: vi.fn(async () => ({ networkId: "preprod" })),
      getConnectionStatus: vi.fn(async () => ({
        status: "connected" as const,
      })),
    };
    const initialApi = {
      name: "1AM",
      connect: vi.fn(async () => connectedApi),
    };
    (window as MidnightWindow).midnight = {
      "11111111-2222-3333-4444-555555555555": initialApi,
    };

    const wallet = new MidnightDappConnectorAdapter();
    const address = await wallet.connect("preprod");
    expect(initialApi.connect).toHaveBeenCalledWith("preprod");
    expect(address).toBe("mn_unshielded_test_addr");
    expect(wallet.isConnected()).toBe(true);
    await expect(
      wallet.signAndSubmit({ circuit: "proveEligibility" }),
    ).rejects.toThrow(WALLET_SUBMIT_NOT_WIRED);
    await wallet.disconnect();
    expect(wallet.isConnected()).toBe(false);
  });
});
