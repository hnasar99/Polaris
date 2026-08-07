import { DemoMidnightAdapter } from "@/lib/midnight/DemoMidnightAdapter";
import { MidnightAdapter } from "@/lib/midnight/MidnightAdapter";
import type { MidnightHealthProtocol } from "@/lib/midnight/protocol";

export function isDemoMidnightEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT === "true";
}

/**
 * Default factory targets MidnightAdapter (real integration boundary).
 * Demo adapter is opt-in via NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true.
 */
export function createMidnightProtocol(): MidnightHealthProtocol {
  if (isDemoMidnightEnabled()) {
    return new DemoMidnightAdapter();
  }
  return new MidnightAdapter();
}
