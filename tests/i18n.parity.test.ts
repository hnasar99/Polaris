import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/i18n/messages/en";
import { es } from "@/i18n/messages/es";

type Dict = Record<string, unknown>;

/** Flatten to dotted keys so a missing nested key is reported by its full path. */
function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value as Dict).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe("i18n message parity", () => {
  const enKeys = flatten(en).sort();
  const esKeys = flatten(es).sort();

  it("has the same keys in English and Spanish", () => {
    expect(esKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
    expect(enKeys.filter((k) => !esKeys.includes(k))).toEqual([]);
  });

  it("has no empty strings", () => {
    for (const dict of [en, es]) {
      for (const key of flatten(dict)) {
        const value = key
          .split(".")
          .reduce<unknown>((acc, part) => (acc as Dict)?.[part], dict);
        expect(typeof value, key).toBe("string");
        expect((value as string).trim().length, key).toBeGreaterThan(0);
      }
    }
  });

  it("resolves every literal t() key used by the app", () => {
    const missing = new Set<string>();
    // The dictionaries themselves contain prose that can look like a t() call.
    for (const file of sourceFiles("src").filter(
      (file) => !file.includes(join("i18n", "messages")),
    )) {
      const source = readFileSync(file, "utf8");
      for (const [, key] of source.matchAll(/\bt\(\s*"([\w.]+)"/g)) {
        if (!enKeys.includes(key)) missing.add(`${key} (${file})`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it("keeps the same interpolation placeholders in both locales", () => {
    const placeholders = (text: string) =>
      (text.match(/\{(\w+)\}/g) ?? []).sort();

    for (const key of enKeys) {
      const read = (dict: unknown) =>
        key.split(".").reduce<unknown>((acc, part) => (acc as Dict)?.[part], dict) as string;
      expect(placeholders(read(es)), key).toEqual(placeholders(read(en)));
    }
  });
});
