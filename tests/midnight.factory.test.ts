import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoMidnightAdapter } from "@/lib/midnight/DemoMidnightAdapter";
import {
  createMidnightProtocol,
  isDemoMidnightEnabled,
} from "@/lib/midnight/factory";
import { MidnightAdapter } from "@/lib/midnight/MidnightAdapter";

describe("createMidnightProtocol factory", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("selects MidnightAdapter by default (demo disabled)", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT", "false");
    expect(isDemoMidnightEnabled()).toBe(false);
    expect(createMidnightProtocol()).toBeInstanceOf(MidnightAdapter);
  });

  it("selects DemoMidnightAdapter only when NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT", "true");
    expect(isDemoMidnightEnabled()).toBe(true);
    const protocol = createMidnightProtocol();
    expect(protocol).toBeInstanceOf(DemoMidnightAdapter);
  });

  it("does not select demo adapter for non-true env values", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT", "1");
    expect(isDemoMidnightEnabled()).toBe(false);
    expect(createMidnightProtocol()).toBeInstanceOf(MidnightAdapter);

    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT", "");
    expect(createMidnightProtocol()).toBeInstanceOf(MidnightAdapter);
  });
});

describe("DemoMidnightAdapter labeling", () => {
  it("never claims real ZK verification on Midnight", async () => {
    const adapter = new DemoMidnightAdapter();
    expect(adapter.label).toBe("DEMO PRIVACY ENGINE");

    const created = await adapter.createStudy({
      externalStudyId: "STUDY_001",
      title: "demo",
      researcherAlias: "lab",
      criteria: {
        minAge: 40,
        requiredDiagnosis: "TYPE_2_DIABETES",
        minHba1cScaled: 70,
        requiredTreatment: "METFORMIN",
        minTreatmentMonths: 12,
      },
      rewardAmount: 25,
      rewardSymbol: "TEST",
    });

    expect(created.demoMode).toBe(true);
    // Explicit product rule: demo results must not be marketed as Midnight ZK.
    const claim = JSON.stringify(created).toLowerCase();
    expect(claim).not.toContain("zk proof verified on midnight");
    expect(claim).not.toContain("verified on midnight");
  });
});
