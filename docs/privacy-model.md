# Privacy model

Polaris is designed around Midnight’s data-protection model: **private witness inputs**, **public ledger only for intentional disclosure**, and **selective disclosure** via zero-knowledge proofs.

**License:** Apache-2.0 documentation. This document is a product architecture note — **not** a legal opinion, HIPAA/GDPR certification, or clinical compliance claim.

---

## Product philosophy

1. **Data stays private** — raw medical attributes remain on the patient client (and, in production, under patient-controlled private state).
2. **Proof travels** — researchers and the network learn that constraints held, not the labs that made them true.
3. **The patient controls disclosure** — consent is grantable and revocable; UI separates what was **PROVED** from what was **NOT DISCLOSED**.

---

## Midnight visibility rules (applied to Polaris)

On Midnight:

| World | Visibility |
|-------|------------|
| `witness` / private state | Local to the user; not posted as plaintext |
| `export ledger` / public transcript | Visible to network observers |
| Circuit **arguments** | Part of the public transcript — treat as public |
| ZK proof | Proves constraints; does **not** hide that a tx occurred, which circuit ran, or public args |

**Implication for eligibility:** diagnosis, HbA1c, age, treatment, and months must enter as **private witness inputs** in the eventual Compact design — not as public circuit parameters. Adapter return types already exclude those fields.

Even with perfect witnesses, observers can still see that *someone* called a given circuit at a given time. Design UI and contracts so that structural leaks are acceptable for the use case (research matching vs full anonymity).

---

## Private data (never public ledger / never Midnight response payload)

- `patientId`
- age
- diagnosis
- HbA1c (scaled integer; e.g. `81` = 8.1%)
- treatment
- treatmentMonths
- issuer credential material / complete medical record
- wallet secrets / seeds

These may exist in:

- Patient vault UI (private to the session)
- `EligibilityProofInput.privateWitness` on the client
- Future Compact witness callbacks

They must **not** appear in:

- `EligibilityResult` / `TransactionResult`
- Researcher dashboard
- URL query parameters
- Logs, analytics, or unsanitized errors
- Supabase queries used as the product eligibility engine

---

## Public / verifiable state (may appear in UI or chain projections)

- `studyId` / external study id
- researcher identifier / alias
- study or criteria **commitment** (when designed)
- proof status / `proofReference` / `transactionId`
- consent status, scope, purpose, expiration
- reward amount / symbol / claim status
- timestamps
- anonymous participant aliases (e.g. `anon_84F2`)
- aggregate counts on the researcher view

---

## Eligibility path (privacy-preserving)

```
Load synthetic record for current patient only
  → Build private witness on client
  → MidnightHealthProtocol.proveEligibility()
  → Render eligible + proved/not-disclosed UI
```

**Forbidden product paths:**

- `SELECT … FROM medical_records WHERE hba1c >= …` (or equivalent) to decide match for the product
- React components that compute Study #001 eligibility for the real path

**Demo exception:** `DemoMidnightAdapter` may evaluate the logical predicate locally when `NEXT_PUBLIC_ENABLE_DEMO_MIDNIGHT=true`. That evaluation is still behind the adapter boundary and must be labeled **DEMO PRIVACY ENGINE**. It must never be described as “ZK proof verified on Midnight”.

---

## Consent

| Store | Role |
|-------|------|
| Midnight (intended) | Source of truth for grant / revoke / expiry |
| Supabase `consent_views` | Optional UI projection only |
| Demo adapter memory | Walkthrough-only; not production SoT |

Patients should be able to revoke; researcher UI must respect revoked / expired access without revealing medical attributes.

---

## UI language

| Concept | Meaning |
|---------|---------|
| **PROVED** | Constraint shown as satisfied without revealing underlying private values |
| **NOT DISCLOSED** | Private attribute was not shared with the researcher / public view |
| **DEMO PRIVACY ENGINE** | Local demo adapter active — not Midnight verification |

---

## Security practices (engineering)

- No Supabase service-role key in the client
- No wallet seeds / private keys in the repository
- Never `console.log` private medical attributes
- Sanitized adapter errors only (`sanitizeError`)
- No private medical data in URL parameters
- Fail closed: default `MidnightAdapter` throws until real bindings exist
- Prefer commitments with fresh nonces over hashes of small domains (Compact design later)
- Domain-separate any persistent hashes (auth vs commitment vs nullifier)
- Validate witness outputs with circuit `assert`s when Compact is written
- Avoid `Set.member` for anonymous membership — prefer Merkle membership patterns when identity unlinkability matters

See also Midnight security guidance (agent skill `midnight-security`) and Compact mental model (`witness` vs `export ledger`, intentional `disclose()`).

---

## Synthetic data disclaimer

All medical information in this repository and seed data is **fictional**. Polaris is a hackathon prototype for architecture and UX of privacy-preserving research matching — not a clinical system and not a compliance certification.
