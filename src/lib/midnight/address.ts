/**
 * Bech32 unshielded address <-> Compact UserAddress bytes.
 *
 * Compact `UserAddress` circuit args must be passed as `{ bytes: Uint8Array }`.
 * Raw `Bytes<32>` args are passed as bare Uint8Array — do not mix them up.
 */

import { MidnightBech32m, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";

export type CompactUserAddress = { bytes: Uint8Array };

export function bech32ToUserAddress(
  bech32: string,
  networkId: string,
): CompactUserAddress {
  const parsed = MidnightBech32m.parse(bech32).decode(
    UnshieldedAddress,
    networkId,
  );
  return { bytes: new Uint8Array(parsed.data) };
}
