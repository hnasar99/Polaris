---
title: "Manual de uso — MedNight (Polaris)"
subtitle: "Personas · Laboratorios · Plataforma"
lang: es
---

# Introducción

**MedNight** (repo: Polaris) conecta personas con investigaciones clínicas sobre **Midnight Network**. Los datos médicos quedan en el dispositivo; el laboratorio solo ve pruebas de elegibilidad y consentimientos, nunca valores crudos. Los pagos a participantes salen del vault de la plataforma en **NIGHT**.

| | |
|---|---|
| **Demo** | https://polaris-blush-psi.vercel.app |
| **Hackathon** | Midnight Hack Buenos Aires 2026 |
| **Billeteras** | 1AM o Lace (`window.midnight`) |

| Rol | Entrada | Ruta |
|-----|---------|------|
| Persona (Paciente) | «Entrar como paciente» | `/patient` |
| Laboratorio | «Entrar como laboratorio» | `/lab` |
| Plataforma (Admin) | Footer → «Consola de la plataforma» | `/admin` |

En cualquier momento: menú → **Cambiar de rol** o **Cerrar sesión**.

---

# 1. Personas (Paciente)

## Para quién

Quien carga estudios médicos, ve investigaciones para las que califica, prueba elegibilidad en privado, consiente y cobra NIGHT.

## Requisitos

- Navegador con billetera Midnight (**1AM** o **Lace**), desbloqueada.
- Red de la billetera alineada con la app (selector de red en el panel de billetera; por defecto `preprod`).
- Estudios clínicos en la bóveda local (edad, diagnóstico, HbA1c, tratamiento, meses, etc.).
- Contrato de plataforma desplegado y bindings activos (si no, las acciones on-chain muestran aviso).

## Cómo usarlo

1. En `/` elegí **Entrar como paciente**.
2. **Conectá la billetera** (barra superior). Sin ella podés recorrer la UI; para probar, consentir y cobrar es obligatoria. Podés **desconectar** cuando quieras.
3. En **Mis datos clínicos**, cargá o editá tus estudios. Quedan en tu dispositivo.
4. Revisá **Oportunidades**: el cruce con criterios públicos corre **localmente**.
5. En una investigación elegible: **Probar elegibilidad en privado** (circuito ZK / Compact).
6. **Autorizar acceso**: elegí alcance y ventana de consentimiento.
7. **Cobrar NIGHT** desde el vault de la plataforma a tu billetera.
8. Opcional: **revocar** el consentimiento.

## Qué ve el laboratorio

Solo que cumplís criterios (prueba ZK) y el alcance que autorizaste. **No** ve valores exactos ni tu identidad clínica. Al cobrar, la dirección unshielded del pago se hace pública; **no** queda ligada a valores médicos.

---

# 2. Laboratorios

## Para quién

Quien publica investigaciones con criterios públicos y sigue una **cohorte agregada anónima**. No ve pacientes ni filas individuales.

## Requisitos

- Entrar como laboratorio (`/lab`).
- **No** necesitás conectar billetera propia.
- Publicar/cerrar on-chain usa la **sesión de plataforma** (consola admin con contrato y billetera activos). Si falta, el aviso enlaza a `/admin`.
- Liquidez en el vault para que los participantes puedan cobrar.

## Cómo usarlo

1. En `/` elegí **Entrar como laboratorio**.
2. En **Nueva investigación**, completá: título, alias, descripción, criterios (edad, diagnóstico, HbA1c, tratamiento, meses), recompensa NIGHT y código único.
3. Publicá. El pago a participantes lo hace el vault de la plataforma (publicar no deposita).
4. En **Mis investigaciones**, seguí contadores: pruebas, consentimientos, cobros, NIGHT pagado.
5. Compartí el código con participantes.
6. Cuando corresponda, **cerrá la inscripción** (desde el navegador que tiene el secreto del investigador).

## Privacidad

- Criterios de inclusión: públicos (para autoevaluación local del paciente).
- Ledger: solo agregados anónimos.
- Sin camino desde la UI del lab hasta un paciente concreto.

---

# 3. Plataforma (Admin)

## Para quién

Operador que despliega el contrato Compact y fondea el vault para que los participantes cobren.

## Requisitos

- Acceso por footer de la landing → **Consola de la plataforma**.
- Billetera Midnight conectada (misma que desplegó el contrato para operar el vault).
- Bindings Compact y assets ZK listos en el entorno de deploy.

## Cómo usarlo

1. Abrí **Consola de la plataforma** (`/admin`).
2. **Conectá la billetera** y verificá la red (se puede cambiar en runtime).
3. **Desplegá** el contrato (panel de progreso paso a paso) o **pegá** una dirección existente y compartila.
4. **Depositá NIGHT** en el vault para cubrir recompensas.
5. Monitoreá saldo, fondeado y pagado. Retirá solo si esta billetera es admin del contrato.
6. Mantener liquidez: si el vault está bajo, los claims fallan hasta recargar.

## Límites

- No ve datos clínicos de pacientes.
- Solo gestiona contrato + liquidez.
- Si la billetera no es la admin del despliegue, el vault queda bloqueado (`NOT_ADMIN`).

---

# Flujo de extremo a extremo

```
Plataforma: desplegar contrato → fondear vault
       ↓
Laboratorio: publicar investigación (criterios + recompensa)
       ↓
Persona: cargar estudios → matching local → probar ZK → consentir → cobrar
       ↓
Laboratorio: ver cohorte agregada (sin datos individuales)
```

---

# Frontera de privacidad (resumen)

| Nunca sale del dispositivo | Queda en el ledger |
|----------------------------|--------------------|
| Edad, diagnóstico, HbA1c | Criterios y compensación de cada estudio |
| Tratamiento y meses | Contadores agregados |
| Nombre / documento / identidad | Estado de consentimiento (alcance, vencimiento) |
| | Marcadores de un solo uso (anti-replay) |

**Único cruce deliberado:** al cobrar, la dirección receptora unshielded es pública; no se liga a valores médicos.

---

# Problemas frecuentes

| Situación | Qué hacer |
|-----------|-----------|
| No hay billetera | Instalá 1AM o Lace, desbloqueala y volvé a buscar |
| Red no coincide | Alineá billetera y app (`preprod` / `preview` / etc.) |
| Billetera trabada / locked | Desbloqueá la extensión; usá **Desconectar** y reconectá |
| Laboratorio no puede publicar | Admin: contrato desplegado + sesión activa en `/admin` |
| Paciente no puede cobrar | Admin: recargar vault; consentimiento válido |
| «No es admin» en vault | Usá la billetera que desplegó el contrato |
| Circuitos no activos | Revisar bindings / `NEXT_PUBLIC_POLARIS_BINDINGS_READY` |

---

# Notas

- Prototipo / MVP: datos de demostración; **no** implica cumplimiento HIPAA/GDPR.
- UI: **MedNight** · repositorio: **Polaris** · contrato: `polaris-health`.
- Más detalle: `docs/privacy-model.md`, `docs/architecture.md`, `docs/presentacion-mednight.md`.
