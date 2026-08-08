---
title: "Polaris Health — alcance del contrato Compact"
subtitle: "Un solo contrato: estudios · consentimiento · vault · payouts"
lang: es
---

# Qué es (y qué no es)

| | |
|---|---|
| **Es** | Un único contrato Compact on-chain: matching de investigación, consentimiento programable, vault de liquidez y payouts en NIGHT |
| **No es** | Varios contratos (el vault de liquidez **no** es un segundo contrato) |
| **No guarda** | Estudios médicos del paciente (eso vive off-chain en el “vault” de datos de la app) |
| **No recibe** | Depósitos del laboratorio: el lab paga a la plataforma **off-chain** |

Fuente: `midnight/contracts/polaris-health.compact`.

---

# Roles

| Rol | Quién es on-chain | Circuitos |
|-----|-------------------|-----------|
| **Admin plataforma** | `adminPk` fijado en el deploy | `fundVault`, `withdrawVault` |
| **Laboratorio** | `researcherPk` derivado del secret del DApp | `createStudy`, `closeStudy` |
| **Paciente** | Secret local → nullifiers + `patientPk` (no es la address de wallet) | `proveEligibility`, `grantConsent`, `revokeConsent`, `claimReward` |

Flujo de actores:

```
Admin ── fundVault / withdrawVault ──┐
Lab   ── createStudy / closeStudy ───┼──► polaris-health
Paciente ── elegibilidad / consent / claim ──┘
                                              │
                                              ▼ claimReward
                                     wallet del paciente (NIGHT)
```

---

# Ledger público (on-chain)

Todo lo siguiente es **plaintext on-chain**. Nunca se almacenan valores médicos crudos.

## Estado global

| Campo | Tipo | Significado |
|-------|------|-------------|
| `adminPk` | `Bytes<32>` (sealed) | Admin fijado en el constructor |
| `vaultBalance` | `Uint<128>` | NIGHT del vault (en Stars) |
| `totalFunded` | `Uint<128>` | Total histórico depositado |
| `totalPaid` | `Uint<128>` | Total histórico pagado a participantes |
| `studyCount` | Counter | Estudios creados |
| `eligibilityProofCount` | Counter | Pruebas de elegibilidad exitosas |
| `consentGrantCount` | Counter | Consentimientos otorgados |
| `rewardClaimCount` | Counter | Claims pagados |

## Mapas y sets

| Campo | Clave / contenido |
|-------|-------------------|
| `studies` | `Map<studyId, StudyRecord>` |
| `consents` | `Map<consentKey(studyId, patientPk), ConsentRecord>` |
| `eligibilityNullifiers` | `Set` — prueba de elegibilidad por (study, secret) |
| `rewardClaims` | `Set` — claim único por (study, secret) |

### StudyRecord

| Campo | Notas |
|-------|-------|
| `criteria` | Umbrales públicos (edad, diagnóstico, HbA1c, tratamiento, meses) |
| `rewardAmount` | Reward por participante (Stars) |
| `active` | Si acepta nuevas elegibilidades / consentimientos |
| `researcherPk` | Dueño del estudio |
| `spent` | Contabilidad de payouts de ese estudio (no es presupuesto) |
| `eligibleCount` / `consentCount` / `claimCount` | Agregados; no identifican pacientes |

### ConsentRecord

| Campo | Notas |
|-------|-------|
| `status` | `NONE` · `ACTIVE` · `REVOKED` |
| `researcherPk` | Lab del estudio |
| `purposeHash` | Hash del propósito |
| `scopeMask` | Bits: diagnóstico, lab, tratamiento, duración |
| `expiresAt` | Unix seconds |
| `round` | Sube en revoke (higiene de replay) |

---

# Witnesses (privado)

Entran **solo** como inputs privados del circuito (implementados en TypeScript):

| Witness | Uso |
|---------|-----|
| `localSecretKey` | Identidad DApp (admin / lab / paciente) |
| `patientAge` | Predicado de elegibilidad |
| `patientDiagnosis` | Predicado de elegibilidad |
| `patientHba1cScaled` | Predicado de elegibilidad |
| `patientTreatment` | Predicado de elegibilidad |
| `patientTreatmentMonths` | Predicado de elegibilidad |

---

# Circuitos (superficie del contrato)

| Circuito | Rol | Efecto principal |
|----------|-----|------------------|
| `fundVault` | Admin | Recibe NIGHT → sube `vaultBalance` y `totalFunded` |
| `withdrawVault` | Admin | Envía NIGHT fuera del vault (recipient público) |
| `createStudy` | Lab | Publica criterios + reward; **sin depósito** |
| `closeStudy` | Lab | `active = false`; claims previos siguen válidos |
| `proveEligibility` | Paciente | Evalúa witnesses vs criterios; si ok, inserta nullifier |
| `grantConsent` | Paciente | Consent `ACTIVE` (exige elegibilidad previa) |
| `revokeConsent` | Paciente | Consent `REVOKED`, `round++` |
| `claimReward` | Paciente | Paga reward desde el vault (una vez) |

---

# Predicado de elegibilidad

Evaluado **solo** dentro del circuito `meetsCriteria` (no hay equivalente confiable en el cliente):

```
age ≥ minAge
AND diagnosis == requiredDiagnosis
AND hba1c ≥ minHba1cScaled
AND treatment == requiredTreatment
AND treatmentMonths ≥ minTreatmentMonths
```

---

# Flujo de negocio

```
1. Admin          fundVault(amount)
2. Lab            paga a la plataforma OFF-CHAIN
3. Lab            createStudy(criteria, reward)
4. Paciente       proveEligibility(studyId)   ← witnesses médicos
5. Paciente       grantConsent(scope, expiry)
6. Paciente       claimReward(recipient)      ← NIGHT desde vault
7. Lab (opcional) closeStudy(studyId)
```

Orden obligatorio para cobrar:

1. Elegibilidad exitosa (nullifier en `eligibilityNullifiers`)
2. Consentimiento `ACTIVE` y no vencido
3. Claim único (nullifier en `rewardClaims`)
4. `vaultBalance ≥ reward`

---

# Modelo de liquidez

```
Lab ── dinero ──► Plataforma (off-chain)
                      │
                      ▼
               fundVault ──► vaultBalance  (en polaris-health)
                      │
                      ▼
               claimReward ──► wallet del paciente
```

- Una sola liquidez on-chain: `vaultBalance`
- El laboratorio **no** deposita en el contrato
- El límite de payout es el vault global, no un presupuesto por estudio
- `spent` por estudio es solo contabilidad

Por eso el vault **no** requiere un segundo contrato: es ledger + circuitos del mismo `polaris-health`.

---

# Frontera de privacidad

| Privado (witness) | Público (ledger / disclose) |
|-------------------|-----------------------------|
| `localSecretKey` | `adminPk`, `researcherPk` |
| edad, diagnóstico, HbA1c, tratamiento, meses | criterios del estudio, reward, contadores |
| — | nullifiers (no revelan datos médicos) |
| — | address de payout en `claimReward` / `withdrawVault` |

`claimReward` cruza la frontera **a propósito**: la address que cobra es pública, pero no queda ligada on-chain al `patientPk` ni a valores médicos.

---

# Identidades (domain separation)

Derivaciones con `persistentHash` y prefijos distintos:

| Derivación | Prefijo |
|------------|---------|
| Admin pk | `polaris:admin:pk:v1` |
| Patient pk | `polaris:patient:pk:v1` |
| Researcher pk | `polaris:researcher:pk:v1` |
| Consent map key | `polaris:consent:key:v1` |
| Eligibility nullifier | `polaris:elig:nul:v1` |
| Claim nullifier | `polaris:claim:nul:v1` |

Los nullifiers de elegibilidad y de claim usan dominios **diferentes**.

---

# Unidades

Montos unshielded en **Stars**: 1 NIGHT = 1\_000\_000 Stars.

---

# Fuera de alcance del contrato

1. **Vault médico del paciente** — almacenamiento off-chain (`src/lib/vault/`), no Compact  
2. **Pago laboratorio → plataforma** — off-chain  
3. **UI / i18n / wallet connect / Supabase** — aplicación Next.js  
4. **Otro archivo `.compact`** — no existe hoy; solo `polaris-health.compact`

---

# Resumen

**Un contrato = estudios públicos + consentimiento + nullifiers + vault de NIGHT.**  
Los datos clínicos y el pago del laboratorio a la plataforma quedan fuera de la chain.
