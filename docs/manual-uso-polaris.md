---
title: "Manual de uso — Polaris (MedNight)"
subtitle: "Personas · Laboratorios · Plataforma"
lang: es
---

# Introducción

**Polaris** (UI: MedNight) conecta personas con investigaciones clínicas sobre Midnight Network. Los datos médicos quedan en el dispositivo; el laboratorio solo ve pruebas de elegibilidad y consentimientos, nunca valores crudos. Los pagos a participantes salen del vault de la plataforma en NIGHT.

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
- Estudios clínicos cargados en la bóveda local (edad, diagnóstico, HbA1c, tratamiento, etc.).
- Contrato de plataforma desplegado (si no, las acciones on-chain fallan con aviso).

## Cómo usarlo

1. En `/` elegí **Entrar como paciente**.
2. **Conectá la billetera** (barra superior o aviso «Conectá tu billetera…»). Sin ella podés recorrer la app; para probar, consentir y cobrar es obligatoria.
3. En **Mis datos clínicos**, cargá o editá tus estudios. Quedan en tu dispositivo; no se envían al laboratorio.
4. Revisá **Oportunidades**: el cruce con criterios públicos corre **localmente**.
5. En una investigación elegible: **Probar elegibilidad en privado** (prueba ZK).
6. **Autorizar acceso**: elegí alcance y ventana de consentimiento.
7. **Cobrar NIGHT** desde el vault de la plataforma a tu billetera.
8. Opcional: **revocar** el consentimiento.

## Qué ve el laboratorio

Solo que cumplís criterios (prueba ZK) y el alcance que autorizaste. **No** ve valores exactos de laboratorio ni tu identidad clínica. Al cobrar, la dirección unshielded del pago se hace pública; no queda ligada a valores médicos.

---

# 2. Laboratorios

## Para quién

Quien publica investigaciones con criterios públicos y sigue una **cohorte agregada anónima**. No ve pacientes ni filas individuales.

## Requisitos

- Entrar como laboratorio (`/lab`).
- **No** necesitás conectar billetera propia.
- Publicar/cerrar on-chain usa la **sesión de plataforma** (consola admin con contrato y billetera activos). Si falta, el aviso enlaza a `/admin`.
- Liquidez en el vault de la plataforma para que los participantes puedan cobrar.

## Cómo usarlo

1. En `/` elegí **Entrar como laboratorio**.
2. En **Nueva investigación**, completá: título, alias, descripción, criterios (edad, diagnóstico, HbA1c, tratamiento, meses), recompensa NIGHT y código único.
3. Publicá. El pago a participantes lo hace el vault de la plataforma (publicar no deposita).
4. En **Mis investigaciones**, seguí contadores agregados: pruebas, consentimientos, cobros, NIGHT pagado.
5. Compartí el código con participantes.
6. Cuando corresponda, **cerrá la inscripción** (desde el navegador que tiene el secreto del investigador).

## Privacidad

- Criterios de inclusión: públicos (para que el paciente autoevalúe en local).
- Ledger: solo agregados anónimos.
- Sin camino desde la UI del lab hasta un paciente concreto.

---

# 3. Plataforma (Admin)

## Para quién

Operador que despliega el contrato y fondea el vault para que los participantes cobren.

## Requisitos

- Acceso por footer de la landing → **Consola de la plataforma**.
- Billetera Midnight conectada.
- Misma billetera que desplegó el contrato (admin sellada on-chain) para operar el vault.
- Bindings Compact listos en el entorno.

## Cómo usarlo

1. Abrí **Consola de la plataforma** (`/admin`).
2. **Conectá la billetera**.
3. **Desplegá** el contrato o **pegá** la dirección existente (y compartila con pacientes/labs).
4. **Depositá NIGHT** en el vault para cubrir recompensas.
5. Monitoreá saldo, fondeado y pagado. Retirá solo si esta billetera es admin del contrato.
6. Mantener liquidez: si el vault está bajo, los claims de pacientes fallan hasta recargar.

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

# Problemas frecuentes

| Situación | Qué hacer |
|-----------|-----------|
| No hay billetera | Instalá 1AM o Lace, desbloqueala y volvé a buscar |
| Laboratorio no puede publicar on-chain | Admin: contrato desplegado + sesión activa en `/admin` |
| Paciente no puede cobrar | Admin: recargar vault; verificar consentimiento válido |
| «No es admin» en vault | Usá la billetera que desplegó el contrato |
| Bindings / circuito no listos | Revisar entorno (`NEXT_PUBLIC_POLARIS_BINDINGS_READY`) |

---

# Notas

- Prototipo / MVP: datos de demostración; no implica cumplimiento HIPAA/GDPR.
- Nombre de producto en UI: **MedNight**; repositorio: **Polaris**.
- Más detalle técnico: `docs/privacy-model.md`, `docs/architecture.md`.
