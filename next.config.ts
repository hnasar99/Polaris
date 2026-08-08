import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "isomorphic-ws": path.join(rootDir, "src/lib/isomorphic-ws-fix.mjs"),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    // Midnight ledger/onchain WASM is asyncWebAssembly (async/await glue).
    // Default browserslist includes op_mini/kaios, which make webpack claim
    // the target lacks async/await even though the real browser does not.
    config.output = {
      ...config.output,
      environment: {
        ...config.output?.environment,
        asyncFunction: true,
      },
    };
    return config;
  },
};

export default nextConfig;
