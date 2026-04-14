# Guía Visual de Pantallas — Formalización, Desembolso y Control Administrativo

> **Tipo:** Role-Based UI Walkthrough (Material de Capacitación)  
> **Versión:** 1.0  
> **Fecha:** 2026-04-14  
> **Prerequisito:** El crédito debe estar en estado `APROBADA` o `EN_FORMALIZACION` para que este módulo se active.  
> **Objetivo:** Después de leer esta guía, cada actor comprenderá exactamente qué pantalla abrir, dónde hacer clic y qué esperar del sistema durante la formalización, desembolso y custodia de pagarés.

---

## Índice por Rol

| # | Rol | Acciones | Sección |
|---|---|---|---|
| 1 | Sistema (automático) | Genera préstamo, contratos, cronograma, pagaré | [Ir →](#1-sistema-acciones-automáticas-post-aprobación) |
| 2 | Asesor Comercial | Sube contrato firmado, entrega pagaré | [Ir →](#2-asesor-comercial) |
| 3 | Tesorería | Valida contratos, ejecuta desembolso | [Ir →](#3-tesorería) |
| 4 | Administrador | Recibe pagarés físicos | [Ir →](#4-administrador-custodia-de-pagarés) |

---

## Mapa de Proceso Completo

```
 SISTEMA              ASESOR                TESORERÍA              ADMINISTRADOR
   │                    │                      │                        │
   │  Genera préstamo   │                      │                        │
   │  + contratos       │                      │                        │
   │  + cronograma      │                      │                        │
   │  + pagaré (check)  │                      │                        │
   ├───────────────────▶│                      │                        │
   │                    │  Imprime contrato    │                        │
   │                    │  Cliente firma       │                        │
   │                    │  Sube foto firmada   │                        │
   │                    ├─────────────────────▶│                        │
   │                    │                      │  Revisa en pantalla    │
   │                    │                      │  ¿Legible? ¿Firmado?  │
   │                    │                      │                        │
   │                    │     ┌────────────────┤                        │
   │                    │     │ Si OK:         │                        │
   │                    │     │ Marca VALIDADO │                        │
   │                    │     │                │                        │
   │                    │     │ Si NO:         │                        │
   │                    │◀────┤ Marca DEVUELTO │                        │
   │                    │     │ + motivo       │                        │
   │                    │     └────────────────┘                        │
   │                    │  (re-sube si fue     │                        │
   │                    │   devuelto)          │                        │
   │                    │                      │                        │
   │                    │                      │  Ejecuta transferencia │
   │                    │                      │  Registra comprobante  │
   │                    │                      │  Confirma desembolso   │
   │                    │                      │                        │
   │  Activa préstamo   │                      │                        │
   │  Genera ruta cobr. │                      │                        │
   │  Envía notificación│                      │                        │
   │                    │                      │                        │
   │                    │  Al cierre del día:  │                        │
   │                    │  Entrega pagarés ────────────────────────────▶│
   │                    │  físicos             │                        │  Verifica
   │                    │                      │                        │  Marca RECIBIDO
   │                    │                      │                        │  Archiva
```

---

## Flujo de Estados del Proceso

```
                     ┌─────────────────┐
                     │    APROBADA      │  ← Etapa 4 (Decisión del Supervisor)
                     └────────┬────────┘
                              │
                    Sistema genera auto:
                    • prestamos (PENDIENTE_DESEMBOLSO)
                    • contratos ×2 (GENERADO)
                    • cuotas_programadas ×N
                    • recepcion_pagares (PENDIENTE)
                    • cuadernos_cliente
                              │
                              ▼
                     ┌─────────────────┐
                     │ EN_FORMALIZACION│
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ Contrato │   │  Pagaré  │   │ Cronograma   │
        │ GENERADO │   │ GENERADO │   │ generado     │
        └────┬─────┘   └────┬─────┘   └──────────────┘
             │              │
     Asesor sube foto  Asesor sube foto
             │              │
             ▼              ▼
        ┌──────────┐   ┌──────────┐
        │ FIRMADO  │   │ FIRMADO  │
        └────┬─────┘   └────┬─────┘
             │              │
     Tesorería valida  Tesorería valida
             │              │
        ┌────┴────┐    ┌────┴────┐
        ▼         ▼    ▼         ▼
   VALIDADO  DEVUELTO  VALIDADO  DEVUELTO
        │     (ciclo)      │     (ciclo)
        └────────┬─────────┘
                 │
         Todos VALIDADO?
                 │ Sí
                 ▼
        ┌─────────────────┐
        │   DESEMBOLSO    │  ← Tesorería ejecuta transferencia
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ PRÉSTAMO ACTIVO │  ← Sistema activa + genera ruta cobranza
        └────────┬────────┘
                 │
         Al cierre del día:
                 │
                 ▼
        ┌─────────────────┐
        │ PAGARÉ RECIBIDO │  ← Administrador confirma recepción
        │ (desbloquea     │     → Comisiones del asesor desbloqueadas
        │  comisiones)    │
        └─────────────────┘
```

---

## 1. Sistema (Acciones Automáticas Post-Aprobación)

### Lo que sucede automáticamente

Cuando el Supervisor emite un dictamen `APROBADO` y la solicitud transiciona a `EN_FORMALIZACION`, el sistema ejecuta las siguientes operaciones sin intervención humana:

| # | Acción automática | Tabla | Resultado visible |
|---|---|---|---|
| 1 | Crea registro de préstamo | `prestamos` | Aparece en la tabla de **Préstamos** con estado `PENDIENTE_DESEMBOLSO` |
| 2 | Genera contrato de préstamo (PDF) | `contratos` | Aparece en el tab **Formalización → Contratos** con estado `GENERADO` |
| 3 | Genera pagaré (PDF) | `contratos` | Segundo documento en el tab **Contratos** con estado `GENERADO` |
| 4 | Genera cronograma de cuotas | `cuotas_programadas` | N filas según tipo de cronograma (FIJO: N cuotas iguales, FLEXIBLE: 0 filas, HIBRIDO: N cuotas sugeridas) |
| 5 | Crea registro de custodia de pagaré | `recepcion_pagares` | Aparece en tab **Recepción de Pagarés** con estado `PENDIENTE` |
| 6 | Crea libreta digital del cliente | `cuadernos_cliente` | Registro de pagos listo para cobranza |
| 7 | Envía notificación al cliente | `notificaciones` | WhatsApp/SMS confirmando aprobación + instrucciones para firma |

> [!NOTE]
> **El tab "Formalización" solo aparece** en la vista de detalle de la solicitud cuando el estado es `EN_FORMALIZACION`, `DESEMBOLSADA` o `ACTIVA`. Si la solicitud está en otro estado, el tab no será visible.

---

## 2. Asesor Comercial

### Tu misión en esta etapa

Eres el puente entre la aprobación y el desembolso. Tu trabajo es coordinar la firma del contrato con el cliente y asegurar que la documentación llegue al sistema con calidad suficiente para que Tesorería la valide.

---

### Paso 1: Recibir la notificación de aprobación

1. Recibirás una notificación (WhatsApp/SMS/Activity Feed) de que el crédito fue **APROBADO**.
2. El sistema ya generó automáticamente el contrato y el pagaré en PDF.

> **Tip:** No necesitas esperar a que alguien te avise por chat. El sistema te notifica directamente.

---

### Paso 2: Acceder al tab Formalización

1. Abre el **Panel Web** → **Solicitudes**.
2. Busca la solicitud aprobada (estará en estado `EN_FORMALIZACION`).
3. Haz clic en la fila para abrir el **Detalle de la Solicitud**.
4. Verás los tabs habituales: **Resumen**, **Documentos**, **Dictamen**, y ahora también **Formalización**.
5. Haz clic en el tab **🔖 Formalización**.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Solicitudes   Juan Pérez García                              │
│                   DNI: 12345678 · Tel: 999-888-777              │
│                   [EN_FORMALIZACION]  [Renovación]               │
│                                                                  │
│  S/ 2,000.00    30 días    S/ 300.00 (15%)    S/ 2,300.00       │
│  Monto          Plazo      Interés             Total             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Resumen]  [Documentos (5)]  [Dictamen (1)]  [🔖Formalización] │
│  ▀▀▀▀▀▀▀▀   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀▀▀   ═══════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📄 Contratos                          [Generar Pagaré ▾] │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  📄 CONTRATO_PRESTAMO     [GENERADO]                 │ │  │
│  │  │                                      [Firmar]        │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  📄 PAGARE                [GENERADO]                 │ │  │
│  │  │                                      [Firmar]        │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  💵 Desembolso                                             │  │
│  │                                                            │  │
│  │     ⚠️  Pendiente generación de préstamo                  │  │
│  │     (o formulario si ya existe el préstamo)                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  📥 Recepción de Pagarés                                   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  🕐 Pagaré — Juan Pérez     [PENDIENTE]             │ │  │
│  │  │                              [Confirmar Recepción]   │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Paso 3: Coordinar la firma del contrato

1. En la sección **Contratos**, verás los documentos generados con estado `GENERADO`.
2. **Imprime** el contrato de préstamo y el pagaré (desde el PDF generado por el sistema).
3. **Coordina con el cliente** para que firme ambos documentos.
4. **Toma una foto clara** del documento firmado.

> [!WARNING]
> **Antes de subir la foto, verifica:**
> - 📸 La foto está **bien iluminada** y **enfocada**
> - ✍️ La **firma del cliente** es visible en los campos indicados
> - 📋 El **nombre y DNI** en el documento son legibles
> - 💰 El **monto** coincide con lo aprobado
>
> Si la foto no cumple estos criterios, Tesorería la **devolverá** y perderás tiempo.

---

### Paso 4: Subir el contrato firmado y marcar como firmado

1. Haz clic en el botón **[Firmar]** junto a cada contrato.
2. El sistema marcará el contrato como `FIRMADO` y registrará la fecha.
3. El estado del contrato cambiará de `GENERADO` a `FIRMADO`.

```
  Antes de firmar:                        Después de firmar:
  ┌────────────────────────────┐          ┌────────────────────────────┐
  │  📄 CONTRATO_PRESTAMO     │          │  📄 CONTRATO_PRESTAMO     │
  │     [GENERADO]             │   ──►   │     [FIRMADO] ✍️ 14 Abr   │
  │              [Firmar]      │          │              [Validar]     │
  └────────────────────────────┘          └────────────────────────────┘
```

> [!IMPORTANT]
> **Tu responsabilidad termina aquí** para los contratos. Ahora Tesorería tomará el control para validar los documentos. Espera la confirmación del desembolso o una posible devolución.

---

### Paso 5: Si Tesorería devuelve un contrato

Si la foto que subiste no cumple los estándares de calidad, recibirás una notificación en tu **Activity Feed**:

> *"Contrato devuelto: [CONTRATO_PRESTAMO] — Motivo: Firma ilegible. Por favor re-suba el documento."*

**Para corregir:**
1. Abre el detalle de la solicitud → tab **Formalización**.
2. Verás el contrato con estado `DEVUELTO` y el motivo de la devolución.
3. Corrige el problema (re-imprime, re-firma, re-fotografía).
4. Sube la nueva foto — el contrato volverá a estado `FIRMADO`.
5. Tesorería lo revisará nuevamente.

```
  Contrato devuelto:                      Después de re-subir:
  ┌────────────────────────────┐          ┌────────────────────────────┐
  │  📄 CONTRATO_PRESTAMO     │          │  📄 CONTRATO_PRESTAMO     │
  │     [DEVUELTO] ❌          │   ──►   │     [FIRMADO] ✍️           │
  │  "Firma ilegible"         │          │              [Validar]     │
  │              [Re-subir]    │          │  (Tesorería re-valida)     │
  └────────────────────────────┘          └────────────────────────────┘
```

---

### Paso 6: Entregar el pagaré físico (Cierre del Día)

Al final de tu jornada:

1. Reúne **todos los pagarés firmados** del día.
2. Entrégalos al **Administrador / Archivo**.
3. El Administrador marcará la recepción en el sistema.

> [!CAUTION]
> **⚠️ Bloqueo de comisiones:** Si no entregas el pagaré, el sistema bloquea el cálculo de tus comisiones asociadas a ese crédito. Sin el pagaré original, la empresa pierde la capacidad de ejecutar un juicio en caso de mora.

---

### Resumen para el Asesor

| ¿Qué hago? | ¿Cuándo? | ¿Qué cambia en el sistema? |
|---|---|---|
| Abro el tab Formalización | Cuando recibo notificación de aprobación | — |
| Hago clic en [Firmar] por cada contrato | Después de que el cliente firma | `contratos.estado` → `FIRMADO` |
| Re-subo si me devuelven | Cuando veo notificación de devolución | `contratos.estado` → `FIRMADO` (reset) |
| Entrego pagarés al Administrador | Cierre del día | `recepcion_pagares.recibido` → `TRUE` (lo marca el Admin) |

---

## 3. Tesorería

### Tu misión en esta etapa

Eres la **última barrera de seguridad** antes de que el dinero salga de la empresa. Tu trabajo es validar visualmente que la documentación sea correcta, ejecutar la transferencia y registrar el comprobante.

---

### Paso 1: Abrir la bandeja de contratos pendientes

1. Abre el **Panel Web** → **Solicitudes**.
2. Filtra por estado **EN_FORMALIZACION**.
3. Abre la solicitud que tenga contratos subidos (estado `FIRMADO`).
4. Ve al tab **🔖 Formalización**.

En la sección **Contratos**, verás los documentos que requieren tu validación:

```
┌────────────────────────────────────────────────────────────────┐
│  📄 Contratos                                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📄 CONTRATO_PRESTAMO                                    │   │
│  │     [FIRMADO] ✍️ 14 Abr 2026                             │   │
│  │                                                          │   │
│  │     ┌──────────────────────────────────────────────┐     │   │
│  │     │  📸 Foto del contrato firmado                │     │   │
│  │     │  (clic para ampliar)                         │     │   │
│  │     └──────────────────────────────────────────────┘     │   │
│  │                                                          │   │
│  │                        [✅ Validar]  [❌ Devolver]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📄 PAGARE                                               │   │
│  │     [FIRMADO] ✍️ 14 Abr 2026                             │   │
│  │                                [✅ Validar]              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Paso 2: Validación visual del contrato

> [!IMPORTANT]
> **Este es tu momento más crítico.** No hagas clic en "Validar" sin completar esta checklist.

Abre cada documento adjunto y verifica:

| # | Check | ¿Qué buscar? | ❌ Devolver si... |
|---|---|---|---|
| 1 | ✅ Legibilidad | La foto/scan se lee claramente | Está borrosa, cortada o demasiado oscura |
| 2 | ✅ Firma del cliente | Firma presente en los espacios indicados | No hay firma o es ilegible |
| 3 | ✅ Coincidencia con DNI | El nombre en el contrato coincide con el DNI de la solicitud | Hay discrepancia en nombres o datos |
| 4 | ✅ Montos correctos | El monto en el contrato coincide con el aprobado por el Supervisor | Los montos no coinciden |
| 5 | ✅ Pagaré completo | El pagaré tiene monto, fecha y firma | Faltan campos obligatorios |

---

### Paso 3a: Si todo está correcto → Validar

1. Haz clic en **[✅ Validar]** junto a cada contrato.
2. Aparecerá una notificación de confirmación: *"Contrato validado por Tesorería"*.
3. El estado del contrato cambiará a `VALIDADO`.
4. Se mostará el badge verde: `✅ Validado`.

```
  Antes:                                  Después:
  ┌────────────────────────────┐          ┌────────────────────────────┐
  │  📄 CONTRATO_PRESTAMO     │          │  📄 CONTRATO_PRESTAMO     │
  │     [FIRMADO]              │   ──►   │     [VALIDADO]             │
  │  [✅ Validar] [❌ Devolver] │          │     ✅ Validado            │
  └────────────────────────────┘          └────────────────────────────┘
```

---

### Paso 3b: Si hay problemas → Devolver

1. Haz clic en **[❌ Devolver]**.
2. Ingresa el **motivo de la devolución** (ej. "Firma ilegible", "Foto borrosa", "Monto incorrecto").
3. El contrato pasa a estado `DEVUELTO`.
4. El asesor recibirá una notificación automática con tu motivo.

> [!WARNING]
> **No desembolses si tienes dudas.** Es preferible devolver un contrato a desembolsar sobre documentación fraudulenta o incompleta. Tú eres la última barrera contra errores y colusión.

---

### Paso 4: Ejecutar el desembolso

Una vez que **TODOS** los contratos estén en estado `VALIDADO`, la sección de **Desembolso** se habilitará con el formulario:

```
┌────────────────────────────────────────────────────────────────────┐
│  💵 Desembolso                                                     │
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Medio:          │  │ Banco Destino:  │  │ Cuenta Destino: │   │
│  │ 🏦 Transferencia│  │ BCP             │  │ 191-xxx-xxx     │   │
│  │    Bancaria  ▾  │  │                 │  │                 │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                    │
│  ┌─────────────────┐                                              │
│  │ N° Operación:   │                                              │
│  │ 00123456789     │                                              │
│  └─────────────────┘                                              │
│                                                                    │
│  Monto a desembolsar: S/ 2,000.00        [📤 Registrar Desembolso]│
└────────────────────────────────────────────────────────────────────┘
```

**Pasos:**
1. Selecciona el **medio de desembolso** (Transferencia Bancaria o Efectivo).
2. Si es transferencia, ingresa: Banco destino, Cuenta destino.
3. Realiza la transferencia en tu **sistema bancario externo**.
4. Regresa al sistema e ingresa el **número de operación**.
5. Haz clic en **[📤 Registrar Desembolso]**.

**Efecto automático del sistema:**

| Acción | Resultado visible |
|---|---|
| Se crea registro en `desembolsos` | Aparece la card verde con los datos del desembolso |
| `prestamos.estado` → `'ACTIVO'` | El préstamo aparece como ACTIVO en la tabla de préstamos |
| `prestamos.fecha_desembolso` = hoy | Fecha registrada |
| Se genera ruta de cobranza | El cliente aparecerá en la ruta del cobrador al día siguiente |
| Notificación al cliente | WhatsApp/SMS confirmando el desembolso |

Después del desembolso exitoso, verás:

```
┌────────────────────────────────────────────────────────────────┐
│  💵 Desembolso                                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  💰  S/ 2,000.00                    [● COMPLETADO]       │   │
│  │                                                          │   │
│  │  TRANSFERENCIA BANCARIA · BCP · ****4321                 │   │
│  │  Op: 00123456789  ·  Fecha: 14 Abr 2026, 10:30          │   │
│  │  Tesorero: María García                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Resumen para Tesorería

| ¿Qué hago? | ¿Cuándo? | ¿Qué cambia en el sistema? |
|---|---|---|
| Abro solicitudes en formalizacion | Cuando hay contratos FIRMADOS | — |
| Valido cada contrato visualmente | Al revisar los documentos | `contratos.estado` → `VALIDADO` |
| Devuelvo con motivo si hay problemas | Documentación deficiente | `contratos.estado` → `DEVUELTO` |
| Ejecuto transferencia bancaria | Todos los contratos VALIDADO | Transferencia real en banco |
| Registro desembolso con comprobante | Inmediatamente después | `desembolsos` INSERT + `prestamos` → `ACTIVO` |

---

## 4. Administrador (Custodia de Pagarés)

### Tu misión en esta etapa

Eres el **custodio de los títulos valores**. Tu trabajo es recibir los pagarés físicos de los asesores al cierre del día y marcar su recepción en el sistema, desbloqueando las comisiones.

---

### Paso 1: Abrir la sección de recepción

1. Abre el **Panel Web** → **Solicitudes**.
2. Abre la solicitud del préstamo activo.
3. Ve al tab **🔖 Formalización**.
4. Desplázate hasta la sección **📥 Recepción de Pagarés**.

```
┌────────────────────────────────────────────────────────────────┐
│  📥 Recepción de Pagarés                                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🕐  Pagaré — Juan Pérez (Asesor: Carlos López)         │   │
│  │      [PENDIENTE]                                         │   │
│  │                              [✅ Confirmar Recepción]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ✅  Pagaré — Ana Martínez (Asesor: Pedro Ruiz)         │   │
│  │      [RECIBIDO]   Recibido: 13 Abr 2026                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Paso 2: Verificar el pagaré físico

Al recibir el pagaré del asesor, verifica:

| # | Check | ¿Qué buscar? |
|---|---|---|
| 1 | ✅ El documento corresponde | Nombre, monto y fecha coinciden con la pantalla |
| 2 | ✅ Firma presente | El cliente firmó el pagaré |
| 3 | ✅ Sin alteraciones | No hay tachones, correcciones o manchas sospechosas |

---

### Paso 3: Confirmar recepción en el sistema

1. Con el pagaré **físicamente en tu mano**, haz clic en **[✅ Confirmar Recepción]**.
2. El sistema actualizará:
   - `recepcion_pagares.recibido = TRUE`
   - `recepcion_pagares.recibido_por = TU_ID`
   - `recepcion_pagares.fecha_recepcion = AHORA`
   - `recepcion_pagares.estado = 'RECIBIDO'`
3. **Las comisiones del asesor quedan desbloqueadas.**
4. Guarda el pagaré en el **archivo físico** de la empresa.

```
  Antes:                                  Después:
  ┌────────────────────────────┐          ┌────────────────────────────┐
  │  🕐 Pagaré — Juan Pérez   │          │  ✅ Pagaré — Juan Pérez   │
  │     [PENDIENTE]            │   ──►   │     [RECIBIDO]             │
  │  [✅ Confirmar Recepción]  │          │     Recibido: 14 Abr 2026 │
  └────────────────────────────┘          └────────────────────────────┘
```

> [!CAUTION]
> **NUNCA marques como recibido un pagaré que no tienes en la mano.** Si un asesor no te entrega el pagaré, déjalo en `PENDIENTE`. El sistema bloqueará sus comisiones automáticamente. Esto no es un castigo — es un control legal para proteger los activos de la empresa.

---

### Resumen para el Administrador

| ¿Qué hago? | ¿Cuándo? | ¿Qué cambia en el sistema? |
|---|---|---|
| Recibo pagarés físicos del asesor | Cierre del día | — |
| Verifico que documento coincide con sistema | Al recibir cada pagaré | — |
| Marco [Confirmar Recepción] | Con el pagaré en mano | `recepcion_pagares` → `RECIBIDO` + comisiones desbloqueadas |
| Archivo el documento | Después de confirmar | Custodia física segura |

---

## Preguntas Frecuentes (FAQ)

### Para Asesores

**P: ¿Cuántas veces pueden devolverme un contrato?**
No hay límite. Cada devolución genera un registro en auditoría. Si hay problemas recurrentes, Tesorería escalará al Supervisor.

**P: ¿Puedo subir la foto del contrato desde mi galería?**
Sí, pero asegúrate de que la foto sea clara y reciente. Tesorería rechazará fotos borrosas o poco legibles.

**P: ¿Qué pasa si no entrego el pagaré hoy?**
Tus comisiones para ese crédito quedan bloqueadas hasta que lo entregues. El pagaré es un título valor legal — sin él, la empresa no puede accionar judicialmente en caso de mora.

**P: ¿Puedo ver el estado de mis comisiones?**
El sistema muestra el estado de las comisiones vinculadas a tus préstamos. Si ves `BLOQUEADA`, verifica si tienes pagarés pendientes de entrega.

---

### Para Tesorería

**P: ¿Puedo desembolsar si solo un contrato está validado?**
El formulario de desembolso está disponible cuando el préstamo existe. Sin embargo, la política operativa indica que **ambos documentos** (contrato + pagaré) deben estar validados antes de proceder.

**P: ¿Puedo desembolsar en efectivo?**
Excepcionalmente sí, seleccionando "💵 Efectivo" como medio. Es un flujo no recomendado que requiere documentación adicional.

**P: ¿Qué hago si devuelvo un contrato y el asesor no lo corrige?**
El préstamo permanece en `PENDIENTE_DESEMBOLSO` indefinidamente. Si el asesor no responde en 24 horas, escala a tu Supervisor.

**P: ¿Puedo anular un desembolso ya registrado?**
No directamente desde la interfaz. Requiere intervención de Gerencia a través de un procedimiento de excepción documentado.

---

### Para Administradores

**P: ¿Qué hago si un pagaré se extravía?**
Marca el registro como `EXTRAVIADO` y notifica inmediatamente a Gerencia. Es un evento grave que afecta la capacidad legal de la empresa.

**P: ¿Puedo marcar la recepción de un pagaré al día siguiente?**
Sí, puedes marcarlo cuando lo recibas. Las comisiones del asesor se desbloquearán en ese momento.

---

## Glosario de Términos del Proceso

| Término | Definición |
|---|---|
| **Formalización** | Etapa posterior a la aprobación donde se generan contratos, se obtienen firmas y se prepara el desembolso. |
| **Contrato de Préstamo** | Documento legal que establece las condiciones del crédito (monto, tasa, plazo, cuotas). |
| **Pagaré** | Título valor que documenta la obligación de pago. Es requisito legal para juicios ejecutivos en caso de incumplimiento. |
| **Desembolso** | Acto de transferir el dinero aprobado al cliente, registrando medio, número de operación y comprobante. |
| **Validación Visual** | Proceso donde Tesorería confirma que la foto del contrato firmado es legible, auténtica y completa. |
| **Devolución** | Rechazo de un contrato por parte de Tesorería, con motivo documentado, que dispara un ciclo de corrección. |
| **Custodia de Títulos** | Proceso de entrega física del pagaré del asesor al administrador, con confirmación digital que desbloquea comisiones. |
| **Activity Feed** | Canal de notificaciones internas del sistema donde se reportan eventos (devoluciones, alertas, etc.). |
| **PENDIENTE_DESEMBOLSO** | Estado del préstamo entre la aprobación y el desembolso efectivo. |
| **Handoff a Cobranza** | Transición automática post-desembolso donde el sistema activa el préstamo e incluye al cliente en las rutas de cobro. |
