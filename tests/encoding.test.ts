import { describe, expect, it } from "vitest";
import {
  decodeConsentScope,
  encodeCode,
  encodeConsentScope,
  encodeStudyId,
  nightToStars,
  starsToNight,
  toHex,
  toUnixSeconds,
} from "@/lib/midnight/encoding";

describe("contract encoding", () => {
  it("derives a stable 32-byte study id from the external id", async () => {
    const a = await encodeStudyId("STUDY_001");
    const b = await encodeStudyId("STUDY_001");
    const other = await encodeStudyId("STUDY_002");

    expect(a).toHaveLength(32);
    expect(toHex(a)).toBe(toHex(b));
    expect(toHex(a)).not.toBe(toHex(other));
  });

  it("pads codes to 32 bytes like Compact pad()", () => {
    const encoded = encodeCode("METFORMIN");
    expect(encoded).toHaveLength(32);
    expect(encoded.subarray(9).every((byte) => byte === 0)).toBe(true);
  });

  it("round-trips the consent scope mask", () => {
    const fields = ["diagnosis", "treatment_duration"];
    const mask = encodeConsentScope(fields);

    expect(mask).toBe(0b1001);
    expect(decodeConsentScope(mask).sort()).toEqual([...fields].sort());
  });

  it("ignores unknown scope fields instead of widening the mask", () => {
    expect(encodeConsentScope(["genome"])).toBe(0);
  });

  it("converts NIGHT to Stars and back", () => {
    expect(nightToStars(25)).toBe(25_000_000n);
    expect(nightToStars(0.5)).toBe(500_000n);
    expect(starsToNight(25_000_000n)).toBe(25);
    expect(() => nightToStars(-1)).toThrow();
  });

  it("rejects an unparseable expiry rather than sending 0 on-chain", () => {
    expect(toUnixSeconds("2026-01-01T00:00:00.000Z")).toBe(1767225600n);
    expect(() => toUnixSeconds("not a date")).toThrow();
  });
});
