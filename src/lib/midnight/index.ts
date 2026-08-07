export type { MidnightHealthProtocol } from "@/lib/midnight/protocol";
export { MidnightAdapter } from "@/lib/midnight/MidnightAdapter";
export { DemoMidnightAdapter } from "@/lib/midnight/DemoMidnightAdapter";
export {
  createMidnightProtocol,
  isDemoMidnightEnabled,
} from "@/lib/midnight/factory";
export {
  MidnightAdapterError,
  MIDNIGHT_NOT_CONNECTED,
  sanitizeError,
} from "@/lib/midnight/errors";
