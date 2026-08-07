# Adapter wiring notes

## MidnightAdapter

Replace each `notConnected()` throw in `src/lib/midnight/MidnightAdapter.ts` with:

1. Build witness from `EligibilityProofInput.privateWitness` (never log it).
2. Invoke generated Compact binding for the circuit.
3. Submit / verify via proof server + wallet providers (not a fake demo tx id).
4. Return only `{ eligible, proofReference, transactionId }`.

## Wallet (DApp Connector → 1AM)

Current boundary in `src/lib/wallet/`:

| Adapter | Role |
|---------|------|
| `UnconnectedWalletAdapter` | Pure stub for tests |
| `LocalDemoWalletAdapter` | Labeled local demo when `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true` |
| `MidnightDappConnectorAdapter` | Default: real `window.midnight` connect via DApp Connector patterns |

### Connect (implemented)

Aligned with `react-wallet-connector` + `1am-wallet` skills:

1. Enumerate `Object.values(window.midnight)` (UUID keys — do not hardcode lace-only keys).
2. `initialApi.connect(networkId)` with `NEXT_PUBLIC_MIDNIGHT_NETWORK` (default `preprod`).
3. `getUnshieldedAddress()` + optional `getConnectionStatus()`.

### Complete 1AM wiring later (not yet)

When Compact bindings + ZK assets exist, finish the dust-free path from `1am-wallet` / `midnight-js` (browser):

1. After connect, call `createConnectedSession(api)`:
   - Parallel: `getConfiguration()`, `getUnshieldedAddress()`, `getShieldedAddresses()`
   - `setNetworkId(config.networkId)` before any SDK ops
   - `FetchZkConfigProvider` for hosted ZK assets
   - `api.getProvingProvider(zkConfigProvider)` + custom `proveTx` (`unprovenTx.prove` + `CostModel`)
   - `walletProvider.balanceTx` → `api.balanceUnsealedTransaction`
   - `midnightProvider.submitTx` → `api.submitTransaction`
   - Patched indexer public data provider (`offset: null` workaround)
2. Wire `MidnightHealthProtocol` methods to `createUnprovenCallTx` / `submitTxAsync` (or deploy pattern).
3. Implement `signAndSubmit` (or replace it) using that session — **never fake ZK success**.
4. For Next.js: WebSocket shim + webpack `asyncWebAssembly` / `topLevelAwait` (see 1am-wallet §12); pin matching `@midnight-ntwrk/*` versions from the skill.

Optional: install `@midnight-ntwrk/dapp-connector-api@4.0.1` for official Window types (local stubs live in `dapp-connector-types.ts` today to avoid pulling the full SDK into the scaffold).

## Demo mode

`NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true` selects `DemoMidnightAdapter` + `LocalDemoWalletAdapter` and shows a **DEMO PRIVACY ENGINE** banner. Disable for any claim of real Midnight verification.
