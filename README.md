<p align="center">
  <img src="docs/assets/midnight-header-dark.svg" alt="Midnight Network" width="220" />
</p>

<h1 align="center">Polaris · MedNight</h1>

<p align="center">
  <strong>Matching de investigación médica con privacidad</strong><br/>
  Hackathon <a href="https://midnight.network">Midnight</a> Buenos Aires 2026
</p>

<p align="center">
  <a href="https://polaris-blush-psi.vercel.app"><img src="https://img.shields.io/badge/Demo-Live-0000FE?style=for-the-badge" alt="Demo live" /></a>
  <a href="https://midnight.network"><img src="https://img.shields.io/badge/Built%20on-Midnight-0A0A0A?style=for-the-badge" alt="Built on Midnight" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge" alt="Apache 2.0" /></a>
</p>

<p align="center">
  <a href="https://polaris-blush-psi.vercel.app">Probar demo</a> ·
  <a href="./docs/manual-uso-polaris.md">Manual de uso</a> ·
  <a href="./docs/polaris-health-contrato.md">Contrato</a> ·
  <a href="./docs/presentacion-mednight.md">Pitch</a>
</p>

---

> Una persona demuestra que califica para un estudio clínico **sin revelar un solo valor médico**.  
> El laboratorio ve una cohorte anónima. La plataforma paga recompensas en **NIGHT**.  
> Todo corre sobre **Midnight Network** con pruebas de conocimiento cero (Compact).

**Tu historia clínica sigue siendo tuya.**

> Prototipo de hackathon. Datos **sintéticos**. Sin claims HIPAA / GDPR / clínicos.

---

## El problema

Hoy, para saber si alguien califica a un estudio, suele hacer falta entregar diagnóstico, laboratorios e historial **antes** de saber si hay match.

Eso implica divulgación innecesaria, poco control del paciente y desconfianza que frena la investigación.

## La solución

Polaris separa **entrada privada** de **resultado verificable**:

```
[ Estudios clínicos ] ──witness──▶ [ Circuito ZK ] ──prueba──▶ [ Ledger Midnight ]
       │ dispositivo                    │                              │
       └──── nunca cruza ───────────────┘                    solo resultado
```

1. La persona carga estudios en una **bóveda local** (en el dispositivo).
2. El cruce con criterios públicos corre **en el cliente**.
3. Un circuito ZK prueba elegibilidad (edad, diagnóstico, HbA1c, tratamiento, meses) **sin publicar los valores**.
4. El paciente **consiente** (alcance + vencimiento) y **cobra NIGHT** desde el vault de la plataforma.

El laboratorio nunca recibe filas clínicas. Solo ve que la prueba pasó y los agregados de la cohorte.

---

## Tres perfiles en la landing

En la demo ([polaris-blush-psi.vercel.app](https://polaris-blush-psi.vercel.app)) elegís un rol. Cada uno tiene su flujo y su superficie on-chain.

| Perfil | Ruta | Billetera | Qué hace |
|--------|------|-----------|----------|
| **Persona (Paciente)** | `/patient` | Sí — 1AM / Lace | Carga datos, prueba ZK, consiente, cobra |
| **Laboratorio** | `/lab` | No (usa sesión de plataforma) | Publica estudios, sigue cohorte anónima |
| **Plataforma (Admin)** | `/admin` | Sí — admin del contrato | Despliega, fondea vault NIGHT |

### 1. Persona — `/patient`

Para quien participa en investigación sin entregar su historia clínica en claro.

1. En `/` → **Entrar como paciente**.
2. Conectá la billetera Midnight (barra superior).
3. En **Mis datos clínicos**, cargá o editá estudios (quedan en el dispositivo).
4. Revisá **Oportunidades**: el matching local usa solo criterios públicos.
5. **Probar elegibilidad en privado** → circuito `proveEligibility`.
6. **Autorizar acceso** → alcance + ventana (`grantConsent`).
7. **Cobrar NIGHT** → `claimReward` desde el vault de la plataforma.
8. Opcional: **revocar** consentimiento (`revokeConsent`).

**Qué ve el lab:** que cumplís criterios y el alcance autorizado. **No** valores exactos ni identidad clínica.

### 2. Laboratorio — `/lab`

Para quien publica investigaciones y observa una **cohorte agregada**, nunca pacientes individuales.

1. En `/` → **Entrar como laboratorio**.
2. Completá **Nueva investigación**: título, criterios, recompensa NIGHT, código.
3. Publicá (`createStudy`). Publicar **no** deposita en el contrato: el lab paga a la plataforma off-chain.
4. Seguís contadores: pruebas, consentimientos, cobros, NIGHT pagado.
5. Cuando corresponda, **cerrá inscripción** (`closeStudy`).

**Privacidad:** criterios públicos para autoevaluación; ledger solo con agregados; sin camino UI lab → paciente concreto.

### 3. Plataforma — `/admin`

Consola operativa (enlace en el footer de la landing). Despliega el contrato y mantiene liquidez.

1. Abrí **Consola de la plataforma** (`/admin`).
2. Conectá billetera y verificá la red (`preprod` por defecto).
3. **Desplegá** `polaris-health` o pegá una dirección existente.
4. **Depositá NIGHT** (`fundVault`) para cubrir recompensas.
5. Monitoreá saldo / fondeado / pagado; retirás solo si sos admin (`withdrawVault`).

**Límite:** no ve datos clínicos. Si la billetera no es la admin del deploy, el vault responde `NOT_ADMIN`.

### Flujo de extremo a extremo

```
Plataforma  →  desplegar contrato → fondear vault
       ↓
Laboratorio →  publicar investigación (criterios + reward)
       ↓
Persona     →  vault local → matching → ZK → consent → claim
       ↓
Laboratorio →  cohorte agregada (sin filas individuales)
```

Guía paso a paso: [`docs/manual-uso-polaris.md`](./docs/manual-uso-polaris.md) · [PDF](./docs/manual-uso-polaris.pdf)

---

## Contrato Compact — `polaris-health`

Un solo contrato on-chain: estudios · consentimiento · vault · payouts.  
Fuente: [`midnight/contracts/polaris-health.compact`](./midnight/contracts/polaris-health.compact)

<p align="center">
  <img src="docs/assets/midnight-mark.svg" alt="Midnight mark" width="72" />
</p>

### Circuitos exportados

| Circuito | Rol | Efecto |
|----------|-----|--------|
| `fundVault` | Admin | Recibe NIGHT → sube `vaultBalance` / `totalFunded` |
| `withdrawVault` | Admin | Envía NIGHT fuera del vault (recipient público) |
| `createStudy` | Lab | Publica criterios + reward; **sin depósito** |
| `closeStudy` | Lab | `active = false`; claims previos siguen válidos |
| `proveEligibility` | Paciente | Evalúa witnesses vs criterios; inserta nullifier |
| `grantConsent` | Paciente | Consent `ACTIVE` (exige elegibilidad previa) |
| `revokeConsent` | Paciente | Consent `REVOKED`, `round++` |
| `claimReward` | Paciente | Paga reward desde el vault (una vez) |

### Witnesses (nunca van al ledger)

| Witness | Uso |
|---------|-----|
| `localSecretKey` | Identidad DApp (admin / lab / paciente) |
| `patientAge` | Predicado de elegibilidad |
| `patientDiagnosis` | Predicado de elegibilidad |
| `patientHba1cScaled` | Predicado de elegibilidad |
| `patientTreatment` | Predicado de elegibilidad |
| `patientTreatmentMonths` | Predicado de elegibilidad |

### Predicado ZK

Evaluado **solo** dentro del circuito `meetsCriteria`:

```
age ≥ minAge
AND diagnosis == requiredDiagnosis
AND hba1c ≥ minHba1cScaled
AND treatment == requiredTreatment
AND treatmentMonths ≥ minTreatmentMonths
```

### Domain separation (identidades y nullifiers)

| Derivación | Prefijo |
|------------|---------|
| Admin pk | `polaris:admin:pk:v1` |
| Patient pk | `polaris:patient:pk:v1` |
| Researcher pk | `polaris:researcher:pk:v1` |
| Consent map key | `polaris:consent:key:v1` |
| Eligibility nullifier | `polaris:elig:nul:v1` |
| Claim nullifier | `polaris:claim:nul:v1` |

Detalle completo: [`docs/polaris-health-contrato.md`](./docs/polaris-health-contrato.md)

---

## Pruebas criptográficas y de frontera de privacidad

Las pruebas Vitest refuerzan el **borde crypto/privacidad** de la app: encoding alineado con Compact, resultados sanitizados, fail-closed sin sesión, y extracción correcta del resultado del circuito. No fabrican pruebas ZK ni simulan elegibilidad.

```bash
npm test
```

| Suite | Qué garantiza |
|-------|----------------|
| `tests/encoding.test.ts` | Study id estable 32-byte, `pad` estilo Compact, máscara de scope, NIGHT ↔ Stars, expiry seguro |
| `tests/sanitized.results.test.ts` | `EligibilityResult` / `TransactionResult` **sin** campos médicos privados (guardia estructural + runtime) |
| `tests/matcher.test.ts` | Matching local sin filtrar valores; criterios fallidos / undetermined sin leak |
| `tests/midnight.factory.test.ts` | Proxy lazy: elegibilidad, consent y reward **fallan cerrados** sin sesión wallet |
| `tests/midnight.adapter.test.ts` | `MidnightAdapter` no da éxito silencioso sin sesión |
| `tests/polaris-tx.result.test.ts` | Extracción correcta de `private.result` del call tx (no trata “ausente” como `false`) |
| `tests/wallet.adapter.test.ts` | DApp Connector real; rechaza submit ZK inventado; timeout / locked wallet |
| `tests/study001.constants.test.ts` | Criterios y HbA1c escalado del estudio demo |

**Toolchain Midnight (fuera de Vitest):**

```bash
npm run compact          # compila polaris-health → midnight/generated/
npm run sync:zk          # copia assets ZK a public/zk/
```

No hay camino demo/simulado: toda llamada va por `MidnightAdapter` y falla cerrada hasta tener sesión, bindings y dirección de contrato.

---

## Stack

| Capa | Tecnología |
|------|------------|
| App | Next.js 16 · React 19 · TypeScript · Tailwind |
| Contratos | Compact (`polaris-health`) · midnight-js |
| Wallet | DApp Connector (`window.midnight`) — 1AM / Lace |
| Datos UI | Supabase (proyecciones; **no** motor de elegibilidad) |
| Deploy | Vercel |
| Tests | Vitest |

Más arquitectura: [`docs/architecture.md`](./docs/architecture.md) · [`docs/privacy-model.md`](./docs/privacy-model.md) · [`midnight/README.md`](./midnight/README.md)

---

## Arranque rápido

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

| Variable | Propósito |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase (opcional con fallback local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Solo clave anon/publishable |
| `NEXT_PUBLIC_MIDNIGHT_NETWORK` | `undeployed` \| `preview` \| `preprod` \| `mainnet` |
| `NEXT_PUBLIC_POLARIS_CONTRACT_ADDRESS` | Dirección del contrato (o deploy desde `/admin`) |
| `NEXT_PUBLIC_POLARIS_BINDINGS_READY` | `true` solo tras `compact` + `sync:zk` |

Proof server local (cuando compiles / pruebes on-chain):

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v
```

---

## Documentación

| Doc | Contenido |
|-----|-----------|
| [Manual de uso](./docs/manual-uso-polaris.md) | Personas · Labs · Plataforma |
| [Contrato Compact](./docs/polaris-health-contrato.md) | Ledger, circuitos, liquidez |
| [Presentación MedNight](./docs/presentacion-mednight.md) | Pitch del hackathon |
| [Arquitectura](./docs/architecture.md) | Capas y adapters |
| [Modelo de privacidad](./docs/privacy-model.md) | Qué es privado vs público |
| [Midnight integration](./midnight/README.md) | Wiring Compact / WASM |

---

## Por qué Midnight

Midnight ofrece **privacidad opcional sobre una cadena pública**: witnesses privados, ledger solo para lo que se divulga, y selective disclosure vía ZK.

Eso encaja con investigación clínica:

- Los criterios pueden ser públicos (matching local)
- Los valores clínicos no deben serlo
- El consentimiento y el pago sí deben ser auditables

---

## Disclaimer

Polaris / MedNight es un prototipo educativo para el **Midnight Hack Buenos Aires 2026**. No es un dispositivo médico, ni un sistema de HC productivo, ni una certificación de cumplimiento.

Logos de Midnight: assets oficiales de [midnight-docs](https://github.com/midnightntwrk/midnight-docs) / [Brand Hub](https://midnight.network/brand-hub).

**License:** [Apache License 2.0](./LICENSE)
