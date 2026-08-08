# Generated bindings

Compiler output from Compact contracts lives here after:

```bash
npm run compact
npm run sync:zk
```

## polaris-health

| Path | Purpose | Git |
|------|---------|-----|
| `polaris-health/contract/` | TypeScript/JS `Contract` + `ledger` bindings | Tracked (needed for Vercel/webpack) |
| `polaris-health/keys/`, `zkir/`, `compiler/` | Intermediate compiler artifacts | Local-only (gitignored) |
| `public/zk/polaris-health/` | Keys + zkir served to the browser | Tracked (copied by `sync:zk`) |

## Rules

1. **Do not invent** fake generated files, stub `Contract` classes, or hand-written prover/verifier keys.
2. Import bindings only via `src/lib/midnight/bindings.ts` (`@polaris/health-contract` alias).
3. Set `NEXT_PUBLIC_POLARIS_BINDINGS_READY=true` only after `contract/` exists and `public/zk/polaris-health` is synced.

## Pipeline

```
midnight/contracts/polaris-health.compact
        → npm run compact
        → midnight/generated/polaris-health/contract
        → npm run sync:zk → public/zk/polaris-health
        → MidnightAdapter / polaris-tx
```
