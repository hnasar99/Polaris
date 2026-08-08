import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Build, coverage and tooling output.
    "coverage/**",
    "supabase/.temp/**",

    // Compact compiler output: generated bindings, proving keys and zkir.
    "midnight/generated/**",
    "midnight/contracts/src/managed/**",
    "public/zk/**",

    // Scratch directories written by tooling, never project source.
    // Browser automation drops a full Chrome profile (bundled extension JS) in
    // .tmp-shots, and its files are deleted mid-run, which also crashes ESLint.
    ".tmp-shots/**",

    // Vendored agent skill content, not part of the app.
    ".agents/**",
    ".cursor/**",
  ]),
]);

export default eslintConfig;
