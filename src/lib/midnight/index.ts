/**
 * Public Midnight surface for the Next.js app.
 *
 * Heavy session / Compact wiring lives in MidnightAdapter and session.ts —
 * import those modules directly when needed. This barrel must stay free of
 * runtime imports that reach Compact/ledger WASM: those are async webpack
 * modules, and pulling one in here makes every `"use client"` consumer async
 * (breaking its exports at the RSC boundary).
 */

export type { MidnightHealthProtocol } from "@/lib/midnight/protocol";
export {
  createMidnightProtocol,
  deployPolarisContract,
} from "@/lib/midnight/factory";
export {
  MidnightAdapterError,
  MIDNIGHT_NOT_CONNECTED,
  MIDNIGHT_SESSION_REQUIRED,
  MIDNIGHT_CONTRACT_ADDRESS_REQUIRED,
  MIDNIGHT_BINDINGS_MISSING,
  sanitizeError,
} from "@/lib/midnight/errors";

/** Deep import for real Compact wiring / tests — not re-exported eagerly. */
export type { ConnectedSession } from "@/lib/midnight/session";
