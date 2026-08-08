/** Display helpers shared by the UI. No SDK imports: safe in any client bundle. */

/** Shorten an address for display without hiding the checksum tail. */
export function truncateAddress(address: string, head = 12, tail = 6): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** HbA1c is stored scaled by 10 (81 === 8.1%). */
export function hba1cFromScaled(scaled: number): number {
  return scaled / 10;
}

export function hba1cToScaled(percent: number): number {
  return Math.round(percent * 10);
}
