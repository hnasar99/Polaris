import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Importing MidnightAdapter pulls in the Compact/ledger WASM, which takes
    // over a minute to transform on a cold cache.
    hookTimeout: 300_000,
    testTimeout: 120_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
