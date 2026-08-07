# Compact contracts (placeholder)

This folder will hold **real Compact source** (`.compact` files) authored and compiled with the official Midnight Compact toolchain.

## Status

- **No compile-ready Compact source is committed here.**
- Do not add invented Compact that claims to compile for judging demos.
- Conceptual design below informs future circuits; implementation must follow Compact book / Midnight docs at coding time.

---

## Intended contracts (conceptual)

Polaris needs privacy-preserving circuits for research matching and programmable consent. Names below are **product concepts**, not committed file names or APIs.

### 1. Eligibility circuit (Study matching)

**Goal:** Prove a patient meets study criteria without revealing raw medical values on-chain.

**Private inputs (witness world):**

- age
- diagnosis code
- HbA1c (scaled integer)
- treatment code
- treatment months
- issuer / credential authenticity material (production)
- fresh nonces / secrets as required by commitment design

**Public / intentional outputs (ledger or sanitized returns):**

- study identifier (or study criteria commitment already on ledger)
- eligibility result (boolean or status enum)
- proof / transaction references consumed by the app
- optional anonymous participation token (commitment / nullifier pattern)

**Logical predicate (not Compact):**

```
age >= minAge
AND diagnosis == requiredDiagnosis
AND hba1cScaled >= minHba1cScaled
AND treatment == requiredTreatment
AND treatmentMonths >= minTreatmentMonths
```

**Privacy notes (design intent):**

- Medical attributes must not be circuit **arguments** that appear in the public transcript; they belong in witnesses.
- Do not store per-patient labs in `export ledger`.
- If membership / “already proved” must be anonymous, prefer Merkle membership over `Set.member` of a linkable identity.
- Use domain-separated hashes/commits; never reuse nonces across commitments.
- Always `assert` witness-derived values before trusting them in logic.

### 2. Consent circuits (grant / revoke)

**Goal:** Patient-controlled, scoped research access with revocation.

**Private inputs:** patient authorization material (secret key / credential witness).

**Public / intentional outputs:**

- study id
- researcher / scope / purpose / expiry (as designed for disclosure)
- consent status: active / revoked / expired
- transaction ids for UI projection

**Design intent:**

- Midnight is the **source of truth** for consent once wired.
- Supabase `consent_views` remains a **UI projection** only — not SoT.
- Grant and revoke should be separate circuits (or clearly separated entry points) so the public transcript’s meaning is intentional.
- Replay protection (round counter, nullifier, or equivalent) should be part of the Compact design.

### 3. Study publication + reward claim (related)

- `createStudy` — publish criteria commitment / study metadata the eligibility circuit can bind to.
- `claimReward` — prototype reward path (25 TEST) gated on eligibility + active consent; avoid leaking medical attributes in claim arguments.

These map to `MidnightHealthProtocol` methods in `src/lib/midnight/protocol.ts`.

---

## Compilation (when real source exists)

Typical Compact compile shape (official toolchain; paths may vary by version):

```bash
compact compile midnight/contracts/<name>.compact midnight/generated/<name>
```

Place **only compiler output** under `../generated/`. See [../generated/README.md](../generated/README.md).

After compile, wire bindings in `src/lib/midnight/MidnightAdapter.ts` per [../integration/README.md](../integration/README.md).

---

## Out of scope for this folder today

- Fake `.compact` files that look real but are unverified
- Hand-written prover/verifier keys
- Claiming on-chain deployment without a real address
