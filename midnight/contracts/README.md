# Compact contracts (Polaris)

Real Compact source for privacy-preserving research matching and programmable consent.

## Status

| Artifact | State |
|----------|--------|
| `polaris-health.compact` | Authored — compile with official Compact toolchain |
| `witnesses.ts` / `encoding.ts` | Ready for adapter wiring after compile |
| `../generated/polaris-health/` | Empty until `npm run compact` |
| `MidnightAdapter` | Still throws until bindings are imported |

## Contract map → app protocol

| Compact circuit | `MidnightHealthProtocol` | Private inputs | Public / ledger effects |
|-----------------|--------------------------|----------------|-------------------------|
| `createStudy` | `createStudy` | researcher `localSecretKey` | `studies[studyId]` + criteria + reward |
| `proveEligibility` | `proveEligibility` | medical witnesses + secret | optional eligibility nullifier; returns `Boolean` |
| `grantConsent` | `grantConsent` | patient secret | `consents[key]` ACTIVE + scope/expiry |
| `revokeConsent` | `revokeConsent` | patient secret | consent → REVOKED, round++ |
| `claimReward` | `claimReward` | patient secret | claim nullifier (once) |

Study #001 logical predicate (enforced in `meetsCriteria`):

```
age >= minAge
AND diagnosis == requiredDiagnosis
AND hba1cScaled >= minHba1cScaled
AND treatment == requiredTreatment
AND treatmentMonths >= minTreatmentMonths
```

MVP thresholds live in `src/domain/study/study001.ts` and must be published via `createStudy` (encode codes with `encoding.ts`).

## Privacy design

- Medical attributes are **witnesses only** — never `export ledger` fields.
- Ledger stores: study criteria (intentional public), consent status/scope/expiry, nullifiers.
- Domain-separated `persistentHash` for patient/researcher/admin keys and nullifiers.
- Eligibility and claim nullifiers use **different** domain separators.
- `Set.member(nullifier)` reveals the nullifier, not labs or diagnosis.
- Consent map keys are `consentKey(studyId, patientPk)` — DApp-derived identity, not wallet address and not medical data.

## Compile

Requires the official Midnight Compact compiler (language ≥ 0.23 / toolchain ≥ 0.31).

On Windows, install and run the compiler **inside WSL** (no native Windows Compact binary). Do not use System32 `compact.exe`.

```bash
# from midnight/contracts (Linux / macOS / WSL)
npm install
npm run compact
# or fast iteration:
npm run compact:skip-zk

# from repo root
npm run compact
```

Output: `midnight/generated/polaris-health/` (keys, zkir, TypeScript `Contract` bindings).

Then wire `src/lib/midnight/MidnightAdapter.ts` per [../integration/README.md](../integration/README.md).

## Encoding conventions (TypeScript ↔ Compact)

| App value | Compact | Helper |
|-----------|---------|--------|
| `TYPE_2_DIABETES` / `METFORMIN` | `Bytes<32>` | `encodeCode` / Compact `pad(32, …)` |
| Study UUID string | `Bytes<32>` SHA-256 | `encodeStudyId` |
| Consent fields | `Uint<8>` bitmask | `encodeConsentScope` (`treatment`=bit0, `treatment_duration`=bit1) |
| Purpose string | `Bytes<32>` SHA-256 | `hashPurpose` |
| Expiry ISO date | `Uint<64>` Unix seconds | adapter converts |

## Witness private state

```ts
type PolarisPrivateState = {
  localSecretKey: Uint8Array; // 32 bytes
  age: number;
  diagnosis: string;
  hba1cScaled: number;
  treatment: string;
  treatmentMonths: number;
};
```

See `witnesses.ts` and `toPolarisPrivateState()`.

## Out of scope (next)

- Issuer attestation (Schnorr / trusted hospital signature) on medical witnesses
- Unshielded/shielded token payout for `claimReward` (ledger nullifier only today)
- Merkle-anonymous eligibility when `Set` linkability is unacceptable
- Wiring `createStudy` into the researcher UI
