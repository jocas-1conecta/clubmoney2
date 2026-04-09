# Guía de Usuario — Originación de Crédito

> **Tipo:** Role-Based Walkthrough (Material de Capacitación)  
> **Versión:** 1.0  
> **Fecha:** 2026-04-07  
> **Objetivo:** Después de leer esta guía, cada actor comprenderá exactamente qué debe hacer, en qué pantalla y en qué momento del proceso de originación.

---

## Índice por Rol

| # | Rol | Etapas donde participa | Sección |
|---|---|---|---|
| 1 | Asesor / Bot de Captación | Etapa 1, Etapa 5 | [Ir →](#1-asesor--bot-de-captación) |
| 2 | Sistema (Reglas automáticas) | Etapa 1, Etapa 2, Etapa 4, Etapa 5 | [Ir →](#2-sistema-reglas-automáticas-y-background-jobs) |
| 3 | Verificador / Cobrador | Etapa 3 | [Ir →](#3-verificador--cobrador) |
| 4 | Supervisor | Etapa 4 | [Ir →](#4-supervisor) |
| 5 | Tesorería / Administrador | Etapa 5 | [Ir →](#5-tesorería--administrador) |

---

## Mapa de Proceso Completo

```
 ASESOR           SISTEMA           VERIFICADOR        SUPERVISOR        TESORERÍA
   │                 │                   │                  │                 │
   │  Crea solicitud │                   │                  │                 │
   ├────────────────▶│                   │                  │                 │
   │  Sube docs      │                   │                  │                 │
   ├────────────────▶│                   │                  │                 │
   │                 │ Valida biometría  │                  │                 │
   │                 │ Consulta Seeker   │                  │                 │
   │                 │ Evalúa riesgo     │                  │                 │
   │                 │                   │                  │                 │
   │                 │  Asigna visita    │                  │                 │
   │                 ├──────────────────▶│                  │                 │
   │                 │                   │ Check-in GPS     │                 │
   │                 │                   │ Fotos + entorno  │                 │
   │                 │                   │ Completa visita  │                 │
   │                 │                   ├─────────────────▶│                 │
   │                 │                   │                  │ Revisa tablero  │
   │                 │                   │                  │ Dictamen        │
   │                 │                   │                  ├────────────────▶│
   │                 │                   │                  │                 │ Valida contrato
   │  Sube contrato  │                   │                  │                 │ Desembolsa
   ├────────────────▶│                   │                  │                 │
   │  Entrega pagaré │                   │                  │                 │
   ├────────────────────────────────────────────────────────────────────────▶│
   │                 │                   │                  │                 │ Recibe pagaré
```

---

## 1. Asesor / Bot de Captación

### Tu misión

Eres el punto de entrada de cada crédito. Tu responsabilidad es ingresar la solicitud de forma completa y estructurada, facilitar la firma del contrato, y **entregar el pagaré físico al cierre del día**.

### Etapa 1 — Crear la Solicitud

#### Paso 1: Registrar al cliente

1. Abre el módulo **"Nueva Solicitud"** en el panel web o la PWA.
2. Ingresa el **DNI** del solicitante (8 dígitos).
3. El sistema buscará automáticamente en la base de datos:
   - **Si existe →** Se carga su ficha con datos pre-llenados. Verás la etiqueta `Cliente Recurrente`.
   - **Si no existe →** Se muestra el formulario de registro nuevo.
4. Completa los campos requeridos:
   - Nombre completo
   - Teléfono
   - Dirección (con referencia)
   - Zona geográfica

> **Tip:** No necesitas recordar si el cliente es nuevo o recurrente. El sistema lo detecta automáticamente al validar el DNI contra la tabla `clientes`.

#### Paso 2: Definir condiciones del préstamo

| Campo | Qué ingresar | Ejemplo |
|---|---|---|
| Monto solicitado | Capital requerido por el cliente | S/ 2,000.00 |
| Plazo (días) | Número de días del préstamo | 30 |
| Tasa de interés | Porcentaje acordado | 15.00% |
| Tipo de cronograma | FIJO / FLEXIBLE / HIBRIDO | FIJO |
| ¿Es renovación? | Sí/No | Sí (se vincula al préstamo anterior) |

#### Paso 3: Subir documentos

Sube las fotos requeridas una por una:

| Documento | Formato aceptado | ¿Qué verificar antes de subir? |
|---|---|---|
| 📋 DNI Frontal | JPG, PNG, PDF | Que se lea el número, nombre y foto |
| 📋 DNI Reverso | JPG, PNG, PDF | Que se lea la dirección |
| 💡 Recibo de Luz | JPG, PNG, PDF | Reciente (< 3 meses), dirección legible |
| 🏠 Contrato de Alquiler | JPG, PNG, PDF | Solo si aplica |
| 🤳 Selfie / Prueba de Vida | JPG, PNG | Rostro visible, bien iluminado |

> [!WARNING]
> **No subas fotos borrosas.** El sistema marcará documentos ilegibles como `BORROSO` y no te dejará avanzar. Verifica la calidad antes de subirlas.

#### Paso 4: Enviar a evaluación

Presiona **"Enviar Solicitud"**. El estado cambiará de `INGRESADA` a `EN_EVALUACION`. A partir de aquí, el Sistema toma el control.

**Tu trabajo en esta etapa ha terminado.** Espera la notificación del resultado.

---

### Etapa 5 — Formalización (cuando el crédito es aprobado)

#### Paso 5: Facilitar la firma del contrato

1. Recibirás una notificación de que el crédito fue **APROBADO**.
2. El sistema ya generó automáticamente el contrato y el pagaré en PDF.
3. **Opción A (Firma Física):**
   - Imprime el contrato y el pagaré.
   - Coordina la firma con el cliente.
   - **Sube la foto del documento firmado** al sistema (busca la solicitud → sección "Contratos" → "Subir firmado").
4. **Opción B (Futura):** Firma digital directamente en la app.

> [!IMPORTANT]
> **El desembolso no ocurrirá** hasta que la foto del contrato firmado esté subida y validada por Tesorería. Si la foto es borrosa o dudosa, Tesorería te la devolverá con un motivo.

#### Paso 6: Entregar el pagaré físico

Al cierre de tu jornada:

1. Reúne **todos los pagarés firmados** del día.
2. Entrégalos al **Administrador / Archivo**.
3. El Administrador marcará la recepción en el sistema.

> [!CAUTION]
> **⚠️ Bloqueo de comisiones:** Si no entregas el pagaré, el sistema bloquea el cálculo de tus comisiones asociadas a ese crédito. Esto no es un castigo — es un control legal. Sin el pagaré original, la empresa pierde la capacidad de ejecutar un juicio en caso de mora.

---

### Resumen para el Asesor

| ¿Qué hago? | ¿Cuándo? | ¿Qué genera? |
|---|---|---|
| Registro la solicitud con DNI y documentos | Al captar al cliente | Registro en `solicitudes_prestamo` + `documentos_solicitud` |
| Subo foto de contrato firmado | Cuando se aprueba | Actualización en `contratos` |
| Entrego pagarés al Administrador | Cierre del día | Actualización `recepcion_pagares` → desbloqueo comisiones |

---

## 2. Sistema (Reglas Automáticas y Background Jobs)

### Tu misión (para el equipo técnico)

El Sistema es el cerebro que ejecuta validaciones, consultas externas, transiciones de estado y notificaciones sin intervención humana. Esta sección documenta las reglas que el sistema aplica automáticamente.

---

### En la Etapa 1 — Validaciones automáticas

| Acción | Trigger | Resultado |
|---|---|---|
| Deduplicación por DNI | INSERT en `solicitudes_prestamo` | Marca `es_cliente_recurrente = TRUE/FALSE` en `clientes`. Si es recurrente y `calificacion_interna = 'EXCELENTE'`, activa bypass. |
| Validación biométrica | Selfie / Prueba de vida subida | Consulta API RENIEC + proveedor biométrico → `validacion_biometrica_ok = TRUE/FALSE` |
| Rechazo por suplantación | `validacion_biometrica_ok = FALSE` | `estado = 'RECHAZADA'`, `motivo_rechazo = 'Validación biométrica fallida'`. Evento → `audit_logs`. |

---

### En la Etapa 2 — Evaluación crediticia

| Acción | Trigger | Resultado |
|---|---|---|
| Consulta Seeker | Solicitud pasa a `EN_EVALUACION` | Dispara API call, almacena respuesta en `seeker_resultados` |
| Auto-rechazo por score | `seeker_resultados.score ≤ UMBRAL_MINIMO` | `estado = 'RECHAZADA'` + notificación automática |
| Alerta de riesgo | `referencias_entorno.problemas_pago = TRUE` (en créditos previos) | Flag de alerta visible en tablero del Supervisor |
| Evaluación del bypass | `es_renovacion = TRUE` AND `calificacion_interna = 'EXCELENTE'` | `requiere_verificacion_campo = FALSE` → transiciona directo a `APROBADA` |

**Tabla de decisión del Bypass:**

| ¿Es renovación? | Calificación interna | ¿Moras > 3 días previas? | Resultado |
|---|---|---|---|
| ✅ Sí | EXCELENTE | ❌ No | → **BYPASS**: Salta a Etapa 4 |
| ✅ Sí | BUENO | — | → Verificación normal |
| ✅ Sí | — | ✅ Sí | → Verificación normal |
| ❌ No | — | — | → Verificación normal |

---

### En la Etapa 4 — Post-dictamen

| Acción | Trigger | Resultado |
|---|---|---|
| Notificación de aprobación | `dictamen = 'APROBADO'` | Envía WhatsApp/SMS al cliente, crea registro en `notificaciones` |
| Notificación de rechazo | `dictamen = 'RECHAZADO'` | Envía mensaje plantilla: "No califica por política interna" |
| Generación automática de préstamo | `estado = 'APROBADA'` → `'EN_FORMALIZACION'` | INSERT en `prestamos`, `contratos` (×2), `cuotas_programadas` |

---

### En la Etapa 5 — Controles automáticos

| Acción | Trigger | Resultado |
|---|---|---|
| Alerta a Tesorería | Contrato firmado subido | Notificación push a Tesorería |
| Notificación de devolución | `contratos.estado = 'DEVUELTO'` | Mensaje en Activity Feed al asesor |
| Bloqueo de comisiones | `recepcion_pagares.recibido = FALSE` después del cierre | `comisiones` no avanza a `CALCULADA` |
| Activación del préstamo | `desembolsos` INSERT exitoso | `prestamos.estado = 'ACTIVO'`, `fecha_desembolso = HOY` |

---

## 3. Verificador / Cobrador

### Tu misión

Eres el operador táctico que recopila evidencia real en campo. Tu trabajo es visitar el domicilio del solicitante, validar que la información es verídica, y **documentar todo con GPS, fotos y el formulario digital**.

---

### Paso 1: Revisar las visitas asignadas

1. Abre la **PWA** en tu celular.
2. Ve a la sección **"Verificaciones Pendientes"**.
3. Verás una lista de visitas programadas para tu zona, ordenadas por prioridad.

Cada visita muestra:

| Dato | Fuente |
|---|---|
| Nombre del cliente | `clientes.nombre_completo` |
| Dirección | `clientes.direccion` + `referencia_direccion` |
| Monto solicitado | `solicitudes_prestamo.monto_solicitado` |
| Tipo | `visitas_presenciales.tipo_visita = 'VERIFICACION'` |

---

### Paso 2: Hacer check-in GPS al llegar

1. Toca el botón **"Iniciar Verificación"** cuando estés frente al domicilio.
2. La app solicitará permisos de ubicación (si no los tiene).
3. El sistema capturará automáticamente:
   - Latitud y longitud → se graban en `evidencias`
   - Hora exacta → `visitas_presenciales.fecha_ejecutada`
   - La visita cambia a estado `EN_CURSO`

> [!CAUTION]
> **⚠️ El GPS debe coincidir con la dirección del cliente.** Si estás lejos del domicilio declarado, el sistema generará una alerta para tu Supervisor. No intentes hacer check-in desde otro lugar.

---

### Paso 3: Tomar fotos de evidencia

Toma las siguientes fotos directamente desde la app (no desde la galería):

| Foto | ¿Qué debe mostrar? | Ejemplo |
|---|---|---|
| 🏠 Fachada | Frente completo de la vivienda con número visible | Casa desde la calle |
| 🏪 Negocio | El negocio del cliente (si tiene) | Puesto de mercado, taller, tienda |
| 📋 DNI en mano | Cliente sosteniendo su DNI junto a su cara | Para validación visual |

> **Tip:** Las fotos se suben directamente al expediente digital. **No las envíes por WhatsApp.** Quedan vinculadas a la visita para auditoría.

---

### Paso 4: Completar el formulario de entorno

Responde las preguntas del formulario digital:

| Pregunta | Tipo | Significado |
|---|---|---|
| ¿Es buen pagador? | ✅ / ❌ | Referencia vecinal positiva |
| ¿Tiene problemas de pago? | ✅ / ❌ | Antecedentes negativos reportados por vecinos |
| ¿Tiene otros prestamistas? | ✅ / ❌ | Otros acreedores activos |
| ¿Vivienda propia? | ✅ / ❌ | Arraigo domiciliario |
| ¿Negocio visible? | ✅ / ❌ | Se verifica fuente de ingresos |
| Comentarios de vecinos | Texto libre | Observaciones relevantes |
| Notas del verificador | Texto libre | Tu evaluación profesional |

> [!WARNING]
> **Sé honesto en las respuestas.** Este formulario alimenta directamente la decisión del Supervisor. Una referencia falsa puede resultar en un crédito riesgoso que eventualmente se vuelve incobrable.

---

### Paso 5: Cerrar la verificación

1. Revisa que tengas: ✅ GPS registrado, ✅ Fotos subidas, ✅ Formulario completado.
2. Toca **"Finalizar Verificación"**.
3. La visita cambia a estado `COMPLETADA`.
4. El sistema notificará automáticamente al Supervisor que la información está lista para revisión.

---

### Resumen para el Verificador

| ¿Qué hago? | ¿Cuándo? | ¿Qué genera? |
|---|---|---|
| Reviso mis visitas asignadas | Al iniciar la jornada | — |
| Hago check-in GPS en el domicilio | Al llegar | `evidencias` (geolocalización) |
| Tomo fotos de fachada y negocio | Durante la visita | `evidencias` (fotos) |
| Completo formulario de entorno | Durante la visita | `referencias_entorno` |
| Cierro la verificación | Al terminar | `visitas_presenciales.estado = 'COMPLETADA'` |

---

## 4. Supervisor

### Tu misión

Eres el decisor que autoriza o niega los créditos. Tu firma digital crea la última capa de trazabilidad antes de que el dinero salga. Tu responsabilidad es la **calidad de la cartera crediticia**.

---

### Paso 1: Revisar las solicitudes pendientes

1. Abre el **Panel Web** → sección **"Comité de Crédito"** o **"Solicitudes en Verificación"**.
2. Verás la lista de solicitudes con estado `VERIFICACION_CAMPO` que ya tienen la información de campo completa.
3. Cada solicitud tiene indicadores de prioridad:

| Indicador | Significado |
|---|---|
| 🟢 Verde | Sin alertas de riesgo |
| 🟡 Amarillo | Alertas menores (otros prestamistas, score medio) |
| 🔴 Rojo | Alerta de riesgo (problemas de pago, score bajo, distancia GPS sospechosa) |

---

### Paso 2: Analizar el Tablero de Decisión

Al abrir una solicitud, verás en una sola pantalla:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TABLERO DE DECISIÓN                          │
├──────────────────────┬──────────────────────────────────────────┤
│  Score Seeker: 720   │  📍 Mapa GPS: ✅ Coincide con dirección │
│  Deudas vigentes: 0  │  📸 Fotos: 3 archivos                  │
│  Calificación: BUENO │  🏠 Fachada: Verificada                │
├──────────────────────┼──────────────────────────────────────────┤
│  REFERENCIAS VECINOS │  HISTORIAL CREDITICIO                   │
│  ✅ Buen pagador     │  Préstamos anteriores: 2                │
│  ❌ Problemas pago   │  Moras > 3 días: 0                     │
│  ❌ Otros prestamist.│  Calificación: EXCELENTE                │
│  ✅ Vivienda propia  │  Última cancelación: 2026-02-15         │
│  ✅ Negocio visible  │                                         │
├──────────────────────┴──────────────────────────────────────────┤
│  DOCUMENTOS: DNI ✅ | Recibo Luz ✅ | Selfie ✅ | Contrato ✅   │
└─────────────────────────────────────────────────────────────────┘
```

**Puntos a evaluar:**

| Factor | ¿Dónde mirar? | Señales de alerta |
|---|---|---|
| Riesgo crediticio | Score Seeker + deudas vigentes | Score < umbral, muchas deudas activas |
| Veracidad del domicilio | Mapa GPS vs. dirección, fotos | GPS no coincide, fotos genéricas |
| Entorno social | Referencias de vecinos | `problemas_pago = TRUE`, `otros_prestamistas = TRUE` |
| Historial con la empresa | Préstamos anteriores | Moras frecuentes, refinanciamientos previos |
| Documentación | Estado de cada documento | Documentos `BORROSO` o faltantes |

---

### Paso 3: Emitir el dictamen

Selecciona una de las tres opciones:

#### Opción A: APROBADO ✅

| Campo | ¿Qué ingresar? |
|---|---|
| Monto aprobado | Puede ser igual o menor al solicitado |
| Tasa aprobada | Puede ajustarse según riesgo |
| Plazo aprobado | Puede modificarse |
| Condiciones especiales | Texto libre (opcional) |
| Motivo | Justificación breve |

**Efecto:** La solicitud pasa a `APROBADA` → `EN_FORMALIZACION`. El sistema genera automáticamente el préstamo, contratos y cronograma. Se notifica al cliente.

#### Opción B: RECHAZADO ❌

| Campo | ¿Qué ingresar? |
|---|---|
| Motivo | Justificación obligatoria |

**Efecto:** La solicitud pasa a `RECHAZADA` (terminal). El sistema envía notificación automática al cliente ("No califica por política interna"). El ticket se cierra.

#### Opción C: OBSERVADO 🟡

| Campo | ¿Qué ingresar? |
|---|---|
| Motivo | Qué información falta o es dudosa |

**Efecto:** La solicitud pasa a `OBSERVADA`. Regresa al asesor/verificador para complementar información. Una vez actualizada, vuelve a tu bandeja.

---

### Paso 4: Validar Renovaciones Express (automáticas)

Para clientes con bypass activado, recibirás una notificación informativa:

> "El cliente Juan Pérez (DNI: 12345678) califica para Renovación Express. Score anterior: EXCELENTE. Moras > 3 días: 0. El sistema ha aprobado automáticamente."

> [!NOTE]
> **No necesitas intervenir** en renovaciones express. El sistema aprueba automáticamente. Sin embargo, puedes revisar y revertir la aprobación si detectas alguna anomalía.

---

### Resumen para el Supervisor

| ¿Qué hago? | ¿Cuándo? | ¿Qué genera? |
|---|---|---|
| Reviso solicitudes con verificación completa | Diariamente (cierre de evaluaciones) | — |
| Analizo tablero de decisión (score + GPS + fotos + referencias) | Por cada solicitud | — |
| Emito dictamen: APROBADO / RECHAZADO / OBSERVADO | Tras análisis | `revisiones_supervisor` + transición de estado |
| Reviso renovaciones express (informativo) | Si hay alertas | Override si se detecta anomalía |

---

## 5. Tesorería / Administrador

### Tu misión

Eres la **última barrera de seguridad** antes de que el dinero salga de la empresa. Tu trabajo no es "pagar a ciegas" — es **validar visualmente** que la documentación sea correcta antes de ejecutar la transferencia. Adicionalmente, como Administrador custodias los pagarés físicos.

---

### Flujo de Tesorería

#### Paso 1: Revisar la bandeja de desembolsos pendientes

1. Abre el **Panel Web** → sección **"Desembolsos Pendientes"**.
2. Verás la lista de préstamos con estado `PENDIENTE_DESEMBOLSO` que ya tienen contratos subidos.

Cada ítem muestra:

| Dato | ¿Qué verificar? |
|---|---|
| Cliente | Nombre + DNI |
| Monto aprobado | Capital a desembolsar |
| Supervisor que aprobó | Que sea un supervisor válido |
| Contratos subidos | Que existan y estén en estado `SUBIDO` |

---

#### Paso 2: Validación visual del contrato

> [!IMPORTANT]
> **Este es tu momento más crítico.** No hagas clic en "Desembolsar" sin completar esta validación.

Abre cada documento adjunto y verifica:

| Check | ¿Qué buscar? | ❌ Rechazar si... |
|---|---|---|
| ✅ Legibilidad | La foto/scan se lee claramente | Está borrosa o cortada |
| ✅ Firma del cliente | Firma presente en los espacios indicados | No hay firma o es ilegible |
| ✅ Coincidencia con DNI | El nombre en el contrato coincide con el DNI | Hay discrepancia en nombres o datos |
| ✅ Montos correctos | El monto en el contrato coincide con el aprobado | Los montos no coinciden |
| ✅ Pagaré completo | El pagaré tiene monto, fecha y firma | Faltan campos |

---

#### Paso 3a: Si todo está correcto → Validar

1. Marca ✅ **"Validar Contrato"** para cada documento.
2. El sistema actualiza: `contratos.validado_por_tesoreria = TRUE`.
3. Ahora puedes proceder a desembolsar.

#### Paso 3b: Si hay problemas → Devolver

1. Marca ❌ **"Devolver a Asesor"**.
2. Ingresa el **motivo de la devolución** (ej. "Firma ilegible", "Foto borrosa", "Monto incorrecto").
3. El sistema actualiza: `contratos.estado = 'DEVUELTO'`.
4. El asesor recibirá una notificación automática en su Activity Feed con el motivo.

> [!WARNING]
> **No desembolses si tienes dudas.** Es preferible devolver un contrato a desembolsar sobre documentación fraudulenta o incompleta. Tú eres la última barrera contra errores y colusión.

---

#### Paso 4: Ejecutar el desembolso

1. Selecciona el **medio de desembolso**:

| Medio | Datos requeridos |
|---|---|
| Transferencia bancaria | Banco destino, número de cuenta, número de operación |
| Efectivo | Registro manual (excepcional) |

2. Realiza la transferencia en el sistema bancario externo.
3. Regresa al sistema y registra:
   - Número de operación
   - Sube la foto/captura del comprobante de transferencia
4. Presiona **"Confirmar Desembolso"**.

**Efecto automático:**
- Se crea registro en `desembolsos`
- `prestamos.estado` → `'ACTIVO'`
- `prestamos.fecha_desembolso` = fecha de hoy
- Se genera la primera ruta de cobranza para el cliente

---

### Flujo del Administrador (Custodia de Pagarés)

#### Paso 5: Recibir pagarés al cierre del día

1. Al final del día, los asesores te entregarán físicamente los pagarés firmados.
2. Abre el **Panel Web** → sección **"Recepción de Pagarés"**.
3. Verás una lista de pagarés pendientes de recepción.

#### Paso 6: Marcar la recepción

Para cada pagaré:

1. Verifica que el documento físico corresponde al listado en pantalla (nombre, monto, fecha).
2. Marca ✅ **"Pagaré Recibido"**.
3. El sistema actualiza:
   - `recepcion_pagares.recibido = TRUE`
   - `recepcion_pagares.recibido_por = TU_ID`
   - `recepcion_pagares.fecha_recepcion = AHORA`
4. Guarda el pagaré en el archivo físico de la empresa.

> [!CAUTION]
> **Sin este check, las comisiones del asesor quedan bloqueadas.** Si un asesor no te entrega el pagaré, déjalo en estado `PENDIENTE`. El sistema se encargará de bloquearlo. **No marques como recibido un documento que no tienes en la mano.**

---

### Resumen para Tesorería / Administrador

| ¿Qué hago? | ¿Cuándo? | ¿Qué genera? |
|---|---|---|
| Reviso y valido fotos de contratos | Cuando llegan a mi bandeja | `contratos.validado_por_tesoreria = TRUE` |
| Devuelvo contratos con problemas | Si la foto es borrosa/incorrecta | `contratos.estado = 'DEVUELTO'` + motivo |
| Ejecuto la transferencia bancaria | Tras validación exitosa | `desembolsos` INSERT |
| Confirmo el desembolso con comprobante | Inmediatamente después | `prestamos.estado = 'ACTIVO'` |
| Recibo pagarés físicos del asesor | Cierre del día | `recepcion_pagares.recibido = TRUE` |
| Archivo los pagarés | Después de recibirlos | Custodia física |

---

## Preguntas Frecuentes (FAQ)

### General

**P: ¿Cuánto tarda el proceso completo?**
| Tipo de cliente | Tiempo estimado |
|---|---|
| Cliente nuevo | < 72 horas (incluyendo visita de campo) |
| Renovación normal | 24-48 horas |
| Renovación Express (cliente A+) | < 1 hora |

**P: ¿Puedo cancelar una solicitud después de enviarla?**
No directamente. Habla con tu Supervisor para que la marque como `RECHAZADA` con el motivo correspondiente.

### Para Asesores

**P: ¿Qué pasa si el sistema rechaza la biometría pero yo conozco al cliente?**
No hay override. La validación biométrica es un control antifraude irreversible. El cliente debe intentar nuevamente con mejores condiciones de iluminación o acudir presencialmente a oficina.

**P: ¿Puedo subir la foto del contrato desde mi galería?**
Sí, pero asegúrate de que la foto sea clara y reciente. El sistema aceptará fotos de la galería, pero Tesorería rechazará fotos borrosas.

### Para Verificadores

**P: ¿Qué hago si el cliente no está en su domicilio?**
Marca la visita como `AUSENTE` y el sistema la reprogramará. No inventes datos ni completes el formulario de entorno sin haber realizado la verificación real.

**P: ¿Puedo verificar sin conectividad?**
La PWA permite modo offline para capturar fotos y GPS. Los datos se sincronizarán cuando recuperes señal. El campo `sync_pending = TRUE` se activará temporalmente.

### Para Supervisores

**P: ¿Puedo modificar mi dictamen después de emitirlo?**
No. Una vez emitido, el dictamen queda registrado en `revisiones_supervisor` como traza de auditoría inmutable. Si necesitas corregir una decisión, contacta a Gerencia para un procedimiento de excepción.

### Para Tesorería

**P: ¿Puedo desembolsar en efectivo?**
Excepcionalmente sí, pero es un flujo no recomendado. Requiere registro detallado y fotos de billetes. La política estándar es transferencia bancaria.

**P: ¿Qué hago si devuelvo un contrato y el asesor no lo corrige?**
El préstamo permanece en `PENDIENTE_DESEMBOLSO` y no se activa. Escala a tu Supervisor si el asesor no responde en 24 horas.

---

## Glosario de Términos

| Término | Definición |
|---|---|
| **Bypass / Renovación Express** | Omisión automática de la verificación de campo para clientes recurrentes con calificación EXCELENTE y sin moras significativas. |
| **Dictamen** | Decisión formal del Supervisor sobre una solicitud (APROBADO/RECHAZADO/OBSERVADO). |
| **Pagaré** | Título valor que documenta la obligación de pago. Su existencia es requisito legal para juicios ejecutivos. |
| **Seeker** | Central de riesgo consultada por API para obtener el score crediticio del solicitante. |
| **Prueba de Vida** | Selfie o validación biométrica que confirma que el solicitante es el titular real del DNI. |
| **RENIEC** | Registro Nacional de Identificación y Estado Civil del Perú. |
| **Novación** | Refinanciamiento que "mata" un préstamo antiguo y crea uno nuevo, preservando la cadena de historial. |
| **Activity Feed** | Canal de notificaciones internas del sistema donde se reportan eventos automáticamente. |
