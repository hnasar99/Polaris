/**
 * Copy Compact compiler ZK assets into public/zk/polaris-health for FetchZkConfigProvider.
 *
 * Usage (after `npm run compact`):
 *   node scripts/sync-zk-assets.mjs
 */

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "midnight", "generated", "polaris-health");
const target = path.join(root, "public", "zk", "polaris-health");

if (!existsSync(source)) {
  console.error(
    "[sync-zk-assets] Missing",
    source,
    "— run `npm run compact` first (WSL/Linux/macOS).",
  );
  process.exit(1);
}

mkdirSync(path.dirname(target), { recursive: true });
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const dir of ["keys", "zkir"]) {
  const from = path.join(source, dir);
  if (existsSync(from)) {
    cpSync(from, path.join(target, dir), { recursive: true });
  }
}

// Some toolchains nest under contract/
const nested = path.join(source, "contract");
if (existsSync(path.join(nested, "keys"))) {
  cpSync(path.join(nested, "keys"), path.join(target, "keys"), {
    recursive: true,
  });
}
if (existsSync(path.join(nested, "zkir"))) {
  cpSync(path.join(nested, "zkir"), path.join(target, "zkir"), {
    recursive: true,
  });
}

console.log("[sync-zk-assets] Synced →", target);
console.log(
  "[sync-zk-assets] Set NEXT_PUBLIC_POLARIS_BINDINGS_READY=true after verifying assets.",
);
