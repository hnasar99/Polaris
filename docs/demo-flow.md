# Demo flow

Hackathon walkthrough for Polaris using the **DEMO PRIVACY ENGINE** (local adapter). This path does **not** require Compact compilation, proof server, or a live Midnight deployment.

**License:** Apache-2.0. Synthetic data only — not a clinical or compliance demo.

---

## Prerequisites

1. Node.js 20+ recommended  
2. Install dependencies:

```bash
npm install
```

3. Copy environment file:

```bash
cp .env.example .env.local
```

4. Enable the demo adapter for a full local walkthrough without Compact bindings:

```env
NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true
```

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/vault`).

### Supabase (optional)

Supabase is optional for the demo: the app can fall back to in-repo synthetic constants if URL/anon key are unset. To use Supabase:

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/publishable only).
2. Apply `supabase/migrations/` and `supabase/seed.sql`.

Seed patient (qualifying): age 47, `TYPE_2_DIABETES`, HbA1c scaled 81, `METFORMIN`, 18 months, issuer `HOSPITAL_DEMO`, verified.  
Seed study: Study #001 criteria + reward **25 TEST**.

---

## Walkthrough

1. **Health Vault** (`/vault`)  
   - See verified private attributes (synthetic).  
   - Read private-data copy (data stays private; proof travels).  
   - **Connect Wallet** (local demo stub when demo Midnight is enabled).

2. **Studies** (`/studies`)  
   - Open Study #001 — Type 2 Diabetes Treatment Study.  
   - Note privacy props and reward **25 TEST**.  
   - Click **Check Eligibility Privately**.

3. **Eligibility path**  
   - Client loads the private record for the current patient.  
   - Builds `EligibilityProofInput` (witness stays client-side).  
   - Calls `MidnightHealthProtocol.proveEligibility()` → `DemoMidnightAdapter`.  
   - **Does not** run eligibility as Supabase SQL.

4. **Eligibility + Consent** (`/eligibility`)  
   - Qualifying seed → **YOU QUALIFY** / eligible.  
   - UI separates **PROVED** vs **NOT DISCLOSED**.  
   - Banner: **DEMO PRIVACY ENGINE**.  
   - **Authorize Research Access** → consent active.  
   - Optionally revoke; confirm researcher view updates appropriately.

5. **Researcher** (`/researcher`)  
   - Counts and `anon_*` rows only.  
   - No raw age / HbA1c / diagnosis / treatment columns.

6. **Optional negative demos** (tests / alternate fixtures)  
   - Age below min → not eligible.  
   - HbA1c below threshold → not eligible.  
   - Revoked consent → access denied / revoked state.

---

## Demo vs real language

| Mode | How selected | Banner | Allowed language |
|------|--------------|--------|------------------|
| Demo adapter | `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true` | DEMO PRIVACY ENGINE | Local evaluation / demo result |
| Real adapter | flag unset/`false` | none | Throws until wired; after real verification only: Midnight / ZK verified |

**Never say** “ZK proof verified on Midnight” while the demo adapter is active.

---

## Default (non-demo) behavior

With `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=false` (or unset):

- Factory returns `MidnightAdapter`.
- Protocol calls throw `Midnight adapter not connected`.
- UI should surface the sanitized adapter-unavailable error.
- This is intentional fail-closed behavior until `midnight/generated` bindings are wired — see [midnight/integration/README.md](../midnight/integration/README.md).

---

## Running tests

```bash
npx vitest run
```

Covered scenarios (application / demo-adapter — **not** Compact verification):

1. Qualifying patient → eligible  
2. Age below min → not eligible  
3. HbA1c below threshold → not eligible  
4. Valid consent → active  
5. Revoked consent → revoked / access denied  
6. `MidnightAdapter` not connected throws  
7. Wallet mock / state machine checks as present under `tests/`

Compact integration tests remain external to Vitest until contracts compile.

---

## Synthetic data disclaimer

All medical information is fictional. This is a hackathon prototype — not a clinical system, and not a compliance certification.
