# Generated bindings (placeholder)

This folder is reserved for **compiler-generated** artifacts from Compact contracts — for example TypeScript client bindings, circuit keys, and related managed output produced by the official Midnight Compact compiler.

## Rules

1. **Do not invent** fake generated files, stub `Contract` classes, or hand-written prover/verifier keys that pretend to be compiler output.
2. **Do not commit** placeholder TypeScript that mimics midnight-js binding shapes unless produced by the toolchain (or an approved official template copied from Midnight examples **after** a real compile step for this project).
3. After a successful `compact compile`, place or link outputs here and import them only from `src/lib/midnight/MidnightAdapter.ts` (or a thin wrapper under `midnight/integration/`).

## Expected contents (later)

Exact layout depends on Compact compiler version. Conceptually you may see:

- TypeScript / JS contract bindings (importable `Contract` or equivalent)
- Prover / verifier key material for circuits
- Intermediate IR / managed artifacts

Until those exist, this directory should contain **documentation only** (this README).

## App import policy

```
midnight/contracts/polaris-health.compact
        → compact compile
        → midnight/generated/polaris-health/*
        → MidnightAdapter (src/lib/midnight)
                                                              ↓
                                              createMidnightProtocol() factory
```

The factory must keep returning `MidnightAdapter` (throwing `Midnight adapter not connected`) until imports from this folder are real and methods are implemented.

Demo evaluation stays in `DemoMidnightAdapter` and must never import fake “proof” modules from here.
