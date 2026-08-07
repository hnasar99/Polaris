# Polaris

Privacy-preserving **medical research matching** for Type 2 Diabetes studies on [Midnight Network](https://midnight.network). Patients prove eligibility and grant programmable consent **without disclosing raw medical attributes** to researchers or a public SQL query path.

**License:** [Apache License 2.0](./LICENSE)

> This is a hackathon MVP prototype. All medical data is **synthetic**. Polaris makes **no HIPAA, GDPR, or clinical compliance claims**.

---

## Problem

Research recruitment often requires sharing diagnosis, lab values, and treatment history with platforms or researchers before a patient knows whether they qualify. That creates unnecessary disclosure and weak patient control.

## Solution

Polaris separates **private local medical input** from **public / verifiable outcomes**:

1. Patient loads their synthetic record (prototype storage only).
2. Client builds a private witness (`EligibilityProofInput`).
3. Client calls `MidnightHealthProtocol.proveEligibility()` — never a Supabase `WHERE` on medical columns for the product path.
4. UI renders only sanitized results: `{ eligible, proofReference, transactionId }` plus consent / reward state.

Midnight’s model (public ledger + private witness + selective disclosure via ZK proofs) is the intended production path. This repo ships **adapter boundaries** and a clearly labeled demo engine until real Compact bindings are connected.

---

## Private vs public

| Stays private (client / witness) | May be public or UI-projected |
|----------------------------------|-------------------------------|
| age, diagnosis, HbA1c, treatment, months | study id, researcher alias |
| full medical credential / record | eligible true/false, proof reference |
| patient id / wallet linkage internals | consent status + scope + expiry |
| | reward amount / claim status |
| | anonymous aliases (`anon_*`) |

Eligibility screen language: **PROVED** vs **NOT DISCLOSED**.

---

## Stack

- **Next.js** (App Router) + React + TypeScript + Tailwind CSS
- **Supabase** — synthetic vault + UI projections only (anon/publishable key)
- **Vitest** — application / demo-adapter tests (not Compact proof verification)
- **Midnight** — `MidnightHealthProtocol` adapter boundary (`src/lib/midnight/`); Compact contracts under `midnight/` placeholders
- **Wallet** — `WalletAdapter` boundary for future 1am / DApp Connector mapping (`src/lib/wallet/`)

See [docs/architecture.md](./docs/architecture.md), [docs/privacy-model.md](./docs/privacy-model.md), and [midnight/README.md](./midnight/README.md).

---

## Product screens

| Route | Screen |
|-------|--------|
| `/vault` | Patient Health Vault |
| `/studies` | Research Opportunities (Study #001) |
| `/eligibility` | ZK / eligibility result + consent |
| `/researcher` | Anonymous researcher dashboard |

`/` redirects to `/vault`.

---

## Getting started

### Prerequisites

- Node.js 20+ recommended
- npm (or yarn / pnpm / bun)

### Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit under `src/app/` — the page updates as you save.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for optimized font loading.

### Environment

Copy [`.env.example`](./.env.example):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional for local fallback) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key only — **never** service-role in the client |
| `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT` | `true` enables local **DEMO PRIVACY ENGINE**; default path uses `MidnightAdapter` (throws until real bindings) |
| `NEXT_PUBLIC_MIDNIGHT_NETWORK` | DApp Connector network id (`undeployed` \| `preview` \| `preprod` \| `mainnet`); default `preprod` |

### Demo walkthrough (no Compact yet)

```env
NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true
```

Then follow [docs/demo-flow.md](./docs/demo-flow.md).

Demo mode must **never** be described as “ZK proof verified on Midnight”.

### Supabase (optional)

Apply `supabase/migrations/` and `supabase/seed.sql` via Supabase CLI or dashboard. Seed includes a qualifying synthetic T2D patient and Study #001 (reward **25 TEST**).

### Tests

```bash
npx vitest run
```

Vitest covers application and demo-adapter logic only. Compact / proof verification tests belong in the Midnight toolchain after contracts compile — see [midnight/README.md](./midnight/README.md).

### Scripts

```bash
npm run dev      # development server
npm test         # Vitest
npm run build    # production build
npm run start    # start production server
npm run lint     # ESLint
```

---

## Midnight integration status

| Piece | Status |
|-------|--------|
| `MidnightHealthProtocol` + factory | Implemented |
| `MidnightAdapter` (real path) | Stub — throws `Midnight adapter not connected` |
| `DemoMidnightAdapter` | Env-gated local evaluation only |
| Compact source / generated bindings | Placeholders under `midnight/` — **not invented** |
| Wallet | `MidnightDappConnectorAdapter` connects via `window.midnight`; `signAndSubmit` throws until prove/balance/submit wired. Demo uses `LocalDemoWalletAdapter`. |

Wiring checklist: [midnight/README.md](./midnight/README.md).

### Midnight toolchain (when compiling contracts)

Use the official Compact installer and proof server (see Midnight docs / `midnight-environment-setup` skill). Typical local proof server:

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v
```

Do not add hand-written fake compiler output under `midnight/generated/`.

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/architecture.md](./docs/architecture.md) | Layers, adapters, consent SoT |
| [docs/privacy-model.md](./docs/privacy-model.md) | Private vs public, security checklist |
| [docs/demo-flow.md](./docs/demo-flow.md) | Hackathon walkthrough |
| [midnight/README.md](./midnight/README.md) | Compact wiring boundary |

---

## Learn more (Next.js)

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

### Deploy on Vercel

You can deploy with the [Vercel Platform](https://vercel.com/new). See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying). For Midnight demos, ensure env flags and adapter mode are set intentionally (demo vs connected).

---

## Disclaimer

Polaris is an educational / hackathon prototype for privacy-preserving research matching patterns on Midnight. It is not a medical device, not a production health record system, and not a compliance certification.
