# Midnight integration (Polaris)

This directory is the **integration boundary** between the Polaris Next.js app and real Midnight Compact contracts.

Polaris does **not** invent:

- Compact source that claims to compile
- Hand-written “generated” TypeScript bindings
- Fake proof-server clients
- Invented 1am / DApp Connector method names beyond the app’s own `WalletAdapter` interface

Those artifacts must come from the **official Midnight toolchain** (Compact compiler, proof server, midnight-js / wallet SDKs) when available.

Apache-2.0 documentation for this integration lives here and under [`docs/`](../docs/).

---

## Why Midnight for Polaris

Midnight is a **data protection blockchain**: public ledger state is visible; private inputs stay in **witnesses** on the user’s device; zk-SNARKs prove that circuit constraints held without revealing witness values.

For medical research matching:

- **Private state** — diagnosis, HbA1c, treatment history stay local.
- **Public / selective outputs** — eligibility flag, consent status, study commitments, anonymous participation signals.
- **Consent source of truth** — intended on Midnight once contracts are connected; Supabase `consent_views` is UI projection only.

See [docs/privacy-model.md](../docs/privacy-model.md) and the Midnight concepts of public vs private state / selective disclosure.

---

## Directory layout

```
midnight/
  README.md           ← this file (wiring checklist + placeholders)
  contracts/          ← polaris-health.compact + witnesses/encoding
  generated/          ← compiler output only — do not hand-author
  integration/        ← how to wire src/lib/midnight + wallet adapters
```

Application-facing code (already in the app):

| Path | Role |
|------|------|
| `src/lib/midnight/protocol.ts` | `MidnightHealthProtocol` interface |
| `src/lib/midnight/MidnightAdapter.ts` | Real path — throws until connected |
| `src/lib/midnight/DemoMidnightAdapter.ts` | Env-gated **DEMO PRIVACY ENGINE** |
| `src/lib/midnight/factory.ts` | `createMidnightProtocol()` |
| `src/lib/wallet/` | `WalletAdapter` boundary (1am mapping later) |
| `src/types/midnight.ts` | Sanitized request/result types |

---

## Expected real flow

```
private patient data (client only)
  → private witness / private state
  → Compact circuit (constraints)
  → proof generation (proof server / local proving)
  → transaction submission (wallet)
  → on-chain verification of proof + public ledger updates
  → sanitized result consumed by frontend
```

Frontend contract (product path):

1. Load current patient’s synthetic record (Supabase or local fallback).
2. Build `EligibilityProofInput` (private fields stay client-side).
3. Call `MidnightHealthProtocol.proveEligibility()`.
4. Render only `{ eligible, proofReference, transactionId }` (+ consent/reward flows).

**Eligibility is never a Supabase SQL product path and never a React business-rule eligibility engine on the real path.** The demo adapter may evaluate criteria locally only when `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true`, and must be labeled **DEMO PRIVACY ENGINE**.

---

## Wiring checklist

1. **Compact source** is in `midnight/contracts/polaris-health.compact` (witnesses + encoding helpers alongside).
2. **Compile** with the official Compact CLI: `npm run compact --prefix midnight/contracts` → `midnight/generated/polaris-health/`. Do not hand-author bindings.
3. **Configure network + deployment address** (placeholders below).
4. **Configure proof server** for the environment that generates proofs (e.g. local Docker on port 6300).
5. **Map wallet provider** (1am / DApp Connector) onto `src/lib/wallet/WalletAdapter` using official APIs only.
6. **Implement `MidnightAdapter`** methods by calling generated bindings + submitting via wallet — see `integration/README.md`.
7. **Keep responses sanitized** — never return private medical attributes to the UI.
8. Set `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=false` once the real adapter is connected.
9. Run Compact / proof integration tests in the Midnight environment; keep Vitest for app/demo logic only.

---

## Placeholders (fill when available)

| Item | Value |
|------|--------|
| Compact source | `midnight/contracts/polaris-health.compact` |
| Contract deployment address | `_TBD_` |
| Network (undeployed / preview / preprod / mainnet) | `_TBD_` |
| Generated TypeScript bindings path | `midnight/generated/polaris-health/` (empty until compiler output) |
| Proof server URL | `_TBD_` (local default often `http://localhost:6300`) |
| Wallet provider | 1am (official SDK mapping pending) |
| Contract adapter entry | `src/lib/midnight/MidnightAdapter.ts` |
| Compact language / toolchain version | `_TBD_` (pin after first successful compile) |

---

## Protocol operations to wire

| Method | Purpose | Intended private inputs | Intended public / sanitized outputs |
|--------|---------|-------------------------|-------------------------------------|
| `createStudy` | Publish study metadata + criteria commitment | researcher secrets as needed | study id, commitment refs, tx id |
| `proveEligibility` | Witness medical attributes against study criteria | age, diagnosis, HbA1c, treatment, months, … | `eligible`, `proofReference`, `transactionId` |
| `grantConsent` | Scoped research access | patient auth witness | consent status, scope, expiry, tx id |
| `revokeConsent` | Patient revocation | patient auth witness | revoked status, tx id |
| `claimReward` | Prototype reward (25 TEST) | eligibility/consent proofs as required | claim status, tx id |

HbA1c uses **scaled integers** (e.g. `81` = 8.1%). Study #001 criteria live in `src/domain/study/study001.ts`.

---

## Conceptual eligibility predicate (not Compact source)

This is the **logical** predicate the Compact circuit should enforce. It is **not** Compact syntax and does not claim to compile.

```
eligible =
  age >= minAge
  AND diagnosis == requiredDiagnosis
  AND hba1cScaled >= minHba1cScaled
  AND treatment == requiredTreatment
  AND treatmentMonths >= minTreatmentMonths
```

Study #001 MVP thresholds: min age 40, `TYPE_2_DIABETES`, HbA1c scaled ≥ 70, `METFORMIN`, treatment months ≥ 12, reward 25 TEST.

Privacy design intent (from Midnight Compact patterns — implement only with real Compact later):

- Private medical values enter via **witnesses**, not as public circuit arguments that land in the public transcript.
- On-chain fields should hold **commitments / status / anonymous tokens**, not raw labs.
- Prefer commitment + nullifier / Merkle membership patterns when anonymity of which patient acted matters.
- `disclose()` (Compact) marks intentional public outputs — it is **not** encryption.

---

## Demo vs real language rules

| Mode | When | Allowed language |
|------|------|------------------|
| `DemoMidnightAdapter` | `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true` | **DEMO PRIVACY ENGINE**, local evaluation |
| `MidnightAdapter` | default | Throws until connected; after wiring, only claim Midnight/ZK verification if proofs are actually verified |

Never label demo results as “ZK proof verified on Midnight”.

---

## Environment tooling (high level)

When you are ready to compile and prove (not required for the demo adapter walkthrough):

1. Install Compact via the official installer; run `compact update` / verify `compact --version`.
2. Ensure Docker is running; start the proof server image.
3. Optionally install the Compact editor extension.
4. Compile contracts into `midnight/generated/` and wire `MidnightAdapter`.

Details: Midnight Network docs and the repo’s `midnight-environment-setup` agent skill under `.agents/skills/`.

---

## Compact integration tests

Unit tests under `/tests` cover application and demo-adapter logic only.

**Compact / proof verification tests belong in the Midnight development environment** after contracts compile. Do not claim Vitest cases verify Compact circuits unless they invoke compiled Compact artifacts.
