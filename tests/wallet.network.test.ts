import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createStorage() {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
  };
}

let storage: ReturnType<typeof createStorage>;

/** Fresh modules per test: both modules cache network-scoped state. */
async function loadModules() {
  vi.resetModules();
  return {
    network: await import("@/lib/wallet/network"),
    runtime: await import("@/lib/midnight/runtime"),
  };
}

describe("network selection", () => {
  beforeEach(() => {
    storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubEnv("NEXT_PUBLIC_MIDNIGHT_NETWORK", "preview");
    vi.stubEnv("NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("falls back to the configured network when nothing is stored", async () => {
    const { network } = await loadModules();
    expect(network.getMidnightNetworkId()).toBe("preview");
  });

  it("prefers the stored network over the configured one", async () => {
    storage.setItem("polaris:network", "preprod");
    const { network } = await loadModules();
    expect(network.getMidnightNetworkId()).toBe("preprod");
  });

  it("ignores an unknown stored network", async () => {
    storage.setItem("polaris:network", "not-a-network");
    const { network } = await loadModules();
    expect(network.getMidnightNetworkId()).toBe("preview");
  });

  it("offers both testnets", async () => {
    const { network } = await loadModules();
    expect(network.listSelectableNetworks()).toEqual(["preview", "preprod"]);
  });
});

describe("contract address scoping", () => {
  beforeEach(() => {
    storage = createStorage();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubEnv("NEXT_PUBLIC_MIDNIGHT_NETWORK", "preview");
    vi.stubEnv("NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("keeps a deploy on the network it was made on", async () => {
    const { runtime } = await loadModules();
    runtime.setMidnightContractAddress("0xpreview");
    expect(runtime.loadPersistedContractAddress()).toBe("0xpreview");

    storage.setItem("polaris:network", "preprod");
    expect(runtime.loadPersistedContractAddress()).toBeNull();

    storage.setItem("polaris:network", "preview");
    expect(runtime.loadPersistedContractAddress()).toBe("0xpreview");
  });

  it("does not offer the build-time address on another network", async () => {
    vi.stubEnv("NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS", "0xfromenv");
    const { runtime } = await loadModules();
    expect(runtime.loadPersistedContractAddress()).toBe("0xfromenv");

    storage.setItem("polaris:network", "preprod");
    expect(runtime.loadPersistedContractAddress()).toBeNull();
  });

  it("moves an unscoped address to the network that predates the selector", async () => {
    storage.setItem("polaris:contract-address", "0xlegacy");
    const { network, runtime } = await loadModules();

    expect(runtime.loadPersistedContractAddress()).toBeNull();
    storage.setItem("polaris:network", network.LEGACY_NETWORK);
    expect(runtime.loadPersistedContractAddress()).toBe("0xlegacy");
    expect(storage.getItem("polaris:contract-address")).toBeNull();
  });
});
