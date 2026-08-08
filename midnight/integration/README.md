# Adapter wiring notes

## Compact source (authored)

Contract: [`../contracts/polaris-health.compact`](../contracts/polaris-health.compact)

| Protocol method | Circuit | Notes |
|-----------------|---------|--------|
| `createStudy` | `createStudy(studyId, minAge, requiredDiagnosis, minHba1cScaled, requiredTreatment, minTreatmentMonths, rewardAmount)` | Encode ids/codes via `src/lib/midnight/encoding.ts` |
| `proveEligibility` | `proveEligibility(studyId) → Boolean` | Medical fields in `PolarisPrivateState` witnesses |
| `grantConsent` | `grantConsent(studyId, purposeHash, scopeMask, expiresAt)` | `encodeConsentScope` + `hashPurpose`; Unix `expiresAt` |
| `revokeConsent` | `revokeConsent(studyId)` | Patient secret must match grant |
| `claimReward` | `claimReward(studyId)` | Requires eligibility nullifier + active unexpired consent |

## Wired application path (current)

```
Wallet.connect (1AM/Lace)
  → createConnectedSession (prove / balanceUnsealed / submit)
  → MidnightRuntime.session

MidnightAdapter.proveEligibility | grantConsent | …
  → require session + contract address + bindings
  → callPolarisCircuit (createUnprovenCallTx / submitCallTxAsync)
  → sanitized { eligible?, transactionId }
```

| Module | Role |
|--------|------|
| `src/lib/midnight/session.ts` | `createConnectedSession`, indexer patch, private state provider |
| `src/lib/midnight/runtime.ts` | In-memory session + contract address |
| `src/lib/midnight/polaris-tx.ts` | Deploy + circuit submit helpers |
| `src/lib/midnight/bindings.ts` | Load generated Contract only when `NEXT_PUBLIC_POLARIS_BINDINGS_READY=true` |
| `src/lib/midnight/MidnightAdapter.ts` | Protocol implementation (fail-closed) |
| `src/lib/wallet/MidnightDappConnectorAdapter.ts` | Connect + session bind |

## Enable real circuit calls

1. Compile on Linux/macOS/WSL: `npm run compact`
2. Sync ZK assets: `npm run sync:zk` → `public/zk/polaris-health/`
3. Deploy once (wallet connected): `await adapter.deploy()` or set `NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS`
4. Set `NEXT_PUBLIC_POLARIS_BINDINGS_READY=true`

Until step 4, `MidnightAdapter` throws `MIDNIGHT_BINDINGS_MISSING` (never fake ZK success).

## MidnightAdapter readiness errors

| Code | Meaning |
|------|---------|
| `MIDNIGHT_SESSION_REQUIRED` | Wallet/session not connected |
| `MIDNIGHT_CONTRACT_ADDRESS_REQUIRED` | No deploy address in env/runtime |
| `MIDNIGHT_BINDINGS_MISSING` | Compact output not linked / flag false |

## Wallet (DApp Connector → 1AM)

| Adapter | Role |
|---------|------|
| `UnconnectedWalletAdapter` | Pure stub for tests |
| `MidnightDappConnectorAdapter` | `window.midnight` connect + `createConnectedSession` (what `createWalletAdapter()` always returns) |

### Connect (implemented)

1. Enumerate `Object.values(window.midnight)`
2. `initialApi.connect(networkId)` with `NEXT_PUBLIC_MIDNIGHT_NETWORK` (default `preprod`)
3. `createConnectedSession(api, "/zk/polaris-health")`
4. Persist DApp secret in `localStorage` (`polaris:dapp-secret-v1`)

### Next.js

- `next dev --webpack` / `next build --webpack` (WASM + topLevelAwait)
- `src/lib/isomorphic-ws-fix.mjs` aliased for `isomorphic-ws`

### Keep WASM out of the eager client graph

`asyncWebAssembly` makes every Compact/ledger WASM module an **async webpack
module**, and that property propagates up static import edges. If a `"use
client"` file statically reaches one, the client module itself becomes async and
its exports read back as `undefined` at the RSC boundary — you get
`X is not a function` or `ChunkLoadError: Loading chunk app/layout failed`.

So `session.ts`, `bindings.ts`, `polaris-tx.ts`, `polaris-read.ts` and
`MidnightAdapter.ts` must only ever be reached via `await import(...)`.
`src/lib/midnight/index.ts` and `src/lib/wallet/index.ts` are the safe barrels;
shared leaf helpers (hex, encoding, ids) live in `src/lib/midnight/encoding.ts`
and `src/lib/midnight/constants.ts`, which import no WASM.
