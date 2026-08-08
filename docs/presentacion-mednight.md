---
title: "MedNight"
subtitle: "Matching de investigación médica con privacidad en Midnight Network"
author: "Polaris · Midnight Hack Buenos Aires 2026"
lang: es
---

# 1. Elevator pitch

**MedNight** permite que una persona demuestre que califica para un estudio clínico **sin revelar un solo valor médico**. El laboratorio publica criterios y ve una cohorte anónima; la plataforma paga recompensas en NIGHT. Todo corre sobre **Midnight Network**, con pruebas de conocimiento cero (Compact).

> *Tu historia clínica sigue siendo tuya.*

**Demo:** https://polaris-blush-psi.vercel.app

---

# 2. El problema

Hoy, para saber si alguien califica a un estudio, suele hacer falta entregar diagnóstico, laboratorios e historial de tratamiento a una plataforma o al investigador **antes** de saber si hay match.

Eso implica:

- Divulgación innecesaria de datos sensibles
- Poco control del paciente sobre el alcance y el tiempo del acceso
- Desconfianza que frena la participación en investigación

---

# 3. La solución

MedNight separa **entrada privada** de **resultado verificable**:

1. La persona carga estudios en una **bóveda local** (en el dispositivo).
2. El cruce con criterios públicos corre **100% en el cliente**.
3. Un circuito ZK prueba elegibilidad (edad, diagnóstico, HbA1c, tratamiento, meses) **sin publicar los valores**.
4. El paciente **consiente** con alcance y vencimiento, y **cobra** NIGHT desde el vault de la plataforma.

El laboratorio nunca recibe filas clínicas. Solo ve que la prueba pasó y los agregados de la cohorte.

---

# 4. Frontera de privacidad

```
  [ Estudios clínicos ] ──witness──▶ [ Circuito ZK ] ──prueba──▶ [ Ledger Midnight ]
         │ dispositivo                    │                              │
         └──── nunca cruza ───────────────┘                    solo resultado
```

| Privado (dispositivo / witness) | Público (ledger / UI) |
|---------------------------------|------------------------|
| Edad, diagnóstico, HbA1c | Criterios del estudio y recompensa |
| Tratamiento y meses | Contadores: pruebas, consentimientos, cobros |
| Identidad / documento | Estado de consentimiento (alcance, vencimiento) |
| | Marcadores anti-replay |

**Único cruce deliberado:** al cobrar, la dirección unshielded receptora es visible; **no** queda ligada a valores médicos ni a la identidad clínica.

---

# 5. Tres roles, un contrato

| Rol | Qué hace | Billetera |
|-----|----------|-----------|
| **Persona** | Carga datos, prueba ZK, consiente, cobra | Sí (1AM / Lace) |
| **Laboratorio** | Publica estudios, sigue cohorte anónima | No (usa sesión de plataforma) |
| **Plataforma** | Despliega contrato, fondea vault NIGHT | Sí (admin del contrato) |

Rutas: `/patient` · `/lab` · `/admin`

---

# 6. Recorrido del producto

1. **Plataforma** despliega `polaris-health` y deposita NIGHT en el vault.
2. **Laboratorio** publica una investigación con criterios y recompensa.
3. **Persona** carga estudios → matching local → prueba ZK → consentimiento → claim.
4. **Laboratorio** observa solo agregados; sin camino a un paciente concreto.

---

# 7. Por qué Midnight

Midnight ofrece **privacidad opcional sobre una cadena pública**: witnesses privados, ledger público solo para lo que se decide divulgar, y selective disclosure vía ZK.

Eso encaja con investigación clínica:

- Los criterios pueden ser públicos (para matching local)
- Los valores clínicos no deben serlo
- El consentimiento y el pago sí deben ser auditables

MedNight no simula elegibilidad: las llamadas van por `MidnightAdapter` y fallan cerradas hasta que hay sesión, contrato y bindings.

---

# 8. Stack técnico

| Capa | Tecnología |
|------|------------|
| App | Next.js 16 · React 19 · TypeScript · Tailwind |
| Contratos | Compact (`polaris-health`) · midnight-js |
| Wallet | DApp Connector (`window.midnight`) — 1AM / Lace |
| Datos UI | Supabase (proyecciones; no motor de elegibilidad) |
| Deploy | Vercel |

Arquitectura: ver `docs/architecture.md` y `docs/privacy-model.md`.

---

# 9. Diferencial

- **0 valores clínicos** en el ledger
- **Matching local** antes de cualquier prueba on-chain
- **Consentimiento programable** (alcance + vencimiento + revocación)
- **Pagos on-chain** sin que el lab deposite por estudio
- UI que separa explícitamente **PROVED** vs **NOT DISCLOSED**

---

# 10. Estado y honestidad del MVP

- Prototipo de hackathon; datos de demostración **sintéticos**
- **Sin** claims de cumplimiento HIPAA / GDPR / clínico
- Bindings Compact y assets ZK desplegados para demo en Vercel
- Camino de producción: fortalecer private state, credenciales del emisor y liquidez del vault

---

# 11. Llamado a la acción

| | |
|---|---|
| **Probar** | https://polaris-blush-psi.vercel.app |
| **Manual de uso** | `docs/manual-uso-polaris.pdf` |
| **Repo** | https://github.com/hnasar99/Polaris |

Elegí rol en la landing: paciente, laboratorio o consola de plataforma.
