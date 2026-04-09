# Módulo 03 — Originación de Crédito

> **Versión:** 2.0  
> **Última actualización:** 2026-04-07  
> **Responsable:** Producto / Tecnología  
> **Motor de datos:** PostgreSQL (Supabase)  
> **Moneda:** PEN (Soles Peruanos)  
> **Política de eliminación:** ZERO-DELETE — solo cambios de estado, jamás DELETE

---

## Resumen Ejecutivo

El módulo de Originación de Crédito digitaliza y controla todo el ciclo de vida de una solicitud de préstamo: desde la captación del cliente hasta el desembolso del dinero. Reemplaza los procesos manuales basados en WhatsApp personal, fotos sueltas y coordinación verbal por un pipeline automatizado con trazabilidad completa, validación antifraude y auditoría inmutable.

### Objetivos del Módulo

1. **Velocidad:** Reducir el tiempo de originación de 3-5 días a < 24 horas (clientes nuevos) o minutos (renovaciones).
2. **Control:** Asegurar que ningún crédito se desembolse sin contrato firmado, score crediticio y aprobación registrada.
3. **Antifraude:** Validar identidad biométrica y detectar suplantación antes de invertir recursos en verificación de campo.
4. **Trazabilidad:** Cada decisión queda registrada en `audit_logs` con actor, timestamp y motivo.

---

## Diagrama de Flujo General

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  1. SOLICITUD &  │────▶│  2. EVALUACIÓN   │────▶│ 3. VERIFICACIÓN  │
│  PRE-FILTRADO    │     │    AUTOMÁTICA    │     │    EN CAMPO      │
│  DIGITAL         │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                              ┌─────────────────────┐      │
                              │ BYPASS: Renovación  │◀─────┘
                              │ Express (clientes    │
                              │ recurrentes A+)      │
                              └───────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │  4. DECISIÓN &   │────▶│ 5. FORMALIZACIÓN │
                         │    APROBACIÓN    │     │   & DESEMBOLSO   │
                         └──────────────────┘     └──────────────────┘
```

---

## Máquina de Estados — `solicitudes_prestamo.estado`

| Estado | Descripción | Transiciones válidas | Actor que dispara |
|---|---|---|---|
| `INGRESADA` | Solicitud registrada con documentos básicos | → `EN_EVALUACION` | Sistema (automático al completar docs) |
| `EN_EVALUACION` | Consulta a Seeker en progreso | → `VERIFICACION_CAMPO`, → `RECHAZADA` | Sistema (resultado Seeker) |
| `VERIFICACION_CAMPO` | Asignada a verificador para visita presencial | → `APROBADA`, → `RECHAZADA`, → `OBSERVADA` | Supervisor (post-revisión) |
| `APROBADA` | Crédito autorizado por Supervisor | → `EN_FORMALIZACION` | Sistema (automático) |
| `RECHAZADA` | Solicitud denegada (terminal) | — | Supervisor / Sistema |
| `OBSERVADA` | Requiere información adicional | → `VERIFICACION_CAMPO`, → `RECHAZADA` | Supervisor |
| `EN_FORMALIZACION` | Generando contrato y preparando desembolso | → (tabla `prestamos`) | Tesorería |

> [!IMPORTANT]
> **Bypass de Renovación Express:** Cuando `es_renovacion = TRUE` y el cliente tiene `calificacion_interna = 'EXCELENTE'` (sin moras > 3 días en créditos anteriores), el campo `requiere_verificacion_campo` se establece en `FALSE` y el estado transiciona directamente de `EN_EVALUACION` → `APROBADA`, omitiendo `VERIFICACION_CAMPO`.

---

## Etapas Detalladas

### Etapa 1 — Solicitud y Pre-Filtrado Digital

| Atributo | Valor |
|---|---|
| **Actores** | Asesor Comercial / Bot de Captación |
| **SLA** | Inmediato (recepción automática) |
| **Estado resultante** | `INGRESADA` → `EN_EVALUACION` |

#### 1.1 Ingreso Estructurado

El asesor crea un registro en `solicitudes_prestamo` con los datos básicos del solicitante. El sistema ejecuta las siguientes validaciones automáticas:

- **Deduplicación por DNI:** Consulta `clientes.dni` para determinar si ya existe registro, marcando `es_cliente_recurrente = TRUE/FALSE` sin depender de la memoria del asesor.
- **Campos requeridos:** `monto_solicitado`, `plazo_dias`, `tasa_interes`, `tipo_cronograma`.

**Tablas involucradas:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `clientes` | SELECT / INSERT | `dni`, `es_cliente_recurrente`, `calificacion_interna` |
| `solicitudes_prestamo` | INSERT | `cliente_id`, `asesor_id`, `monto_solicitado`, `estado = 'INGRESADA'` |

#### 1.2 Carga de Requisitos Documentales

Los documentos requeridos se suben a Supabase Storage y se registran en `documentos_solicitud`:

| Tipo Documento | `tipo_documento` | Obligatorio |
|---|---|---|
| DNI Frontal | `DNI_FRONTAL` | ✅ |
| DNI Reverso | `DNI_REVERSO` | ✅ |
| Recibo de Luz | `RECIBO_LUZ` | ✅ |
| Contrato de Alquiler | `CONTRATO_ALQUILER` | Condicional |
| Selfie / Prueba de Vida | `SELFIE` / `PRUEBA_VIDA` | ✅ |

> [!TIP]
> **Mejora: Pre-validación de calidad de imagen.** El sistema puede integrar IA o validación simple para detectar imágenes borrosas antes de aceptarlas. El campo `estado_validacion` marca automáticamente cada documento como `RECIBIDO` y puede transicionar a `BORROSO` si no cumple el umbral de calidad.

**Tabla involucrada:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `documentos_solicitud` | INSERT (por archivo) | `solicitud_id`, `tipo_documento`, `url_archivo`, `estado_validacion = 'RECIBIDO'` |

#### 1.3 Validación de Identidad (Anti-Fraude)

Antes de avanzar a la evaluación crediticia, se ejecuta una verificación de identidad:

1. **Consulta RENIEC vía API:** Valida que el DNI existe y extrae el nombre legal.
2. **Prueba de Vida:** Selfie o validación biométrica contra el padrón (vía Metamap, Veriff u otro proveedor).
3. **Resultado:** Se actualiza `solicitudes_prestamo.validacion_biometrica_ok = TRUE/FALSE`.

> [!CAUTION]
> **Regla Antifraude: Rechazo por Suplantación.** Si la validación biométrica falla (`validacion_biometrica_ok = FALSE`), el sistema rechaza automáticamente la solicitud (`estado = 'RECHAZADA'`, `motivo_rechazo = 'Validación biométrica fallida'`) y registra el evento en `audit_logs`. No se permite override manual para este caso.

---

### Etapa 2 — Evaluación Automática

| Atributo | Valor |
|---|---|
| **Actores** | Sistema (Integración Seeker API) |
| **SLA** | Minutos (proceso automático) |
| **Estado resultante** | `EN_EVALUACION` → `VERIFICACION_CAMPO` / `RECHAZADA` |

#### 2.1 Consulta a Central de Riesgo

El sistema dispara una consulta automática a la central de riesgo (Seeker) y almacena el resultado estructurado:

**Tabla involucrada:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `seeker_resultados` | INSERT | `solicitud_id`, `cliente_id`, `score`, `resumen_deudas` (JSONB), `resultado_raw` (JSONB) |

> [!TIP]
> **Mejora: Eliminación de interpretación manual.** Antes, los asesores descargaban reportes PDF del buró de crédito y los interpretaban subjetivamente. Ahora, la respuesta JSON de Seeker se mapea directamente a campos estructurados, eliminando el sesgo humano en la lectura del score.

#### 2.2 Filtrado Rápido (Auto-Rechazo)

El sistema aplica reglas de rechazo automático basadas en:

| Regla | Fuente de datos | Acción |
|---|---|---|
| Score externo ≤ umbral mínimo | `seeker_resultados.score` | `estado = 'RECHAZADA'` + notificación |
| Historial interno con "Problemas de pago" | `referencias_entorno.problemas_pago = TRUE` (créditos previos) | Marca `Alerta de Riesgo` antes de enviar a campo |
| Cliente con préstamos activos en mora | `prestamos.estado = 'EN_MORA'` + `casos_morosidad.estado = 'ABIERTO'` | `estado = 'RECHAZADA'` |

> [!WARNING]
> **Regla Antifraude: Filtrado Pre-Campo.** El rechazo automático protege contra el costo operativo de enviar verificadores a domicilios de clientes que no califican. Cada visita fallida tiene un costo logístico estimado de S/ 25-50.

---

### Etapa 3 — Verificación en Campo

| Atributo | Valor |
|---|---|
| **Actores** | Verificador / Cobrador |
| **SLA** | 24–48 horas (según ruta geográfica) |
| **Estado resultante** | `VERIFICACION_CAMPO` (sin cambio — espera dictamen del Supervisor) |

#### 3.0 Bypass de Renovación Express

> [!IMPORTANT]
> **Condiciones del Bypass:**
> - `solicitudes_prestamo.es_renovacion = TRUE`
> - `clientes.calificacion_interna = 'EXCELENTE'`
> - Sin moras superiores a 3 días en créditos anteriores
>
> **Efecto:** `requiere_verificacion_campo = FALSE`. La solicitud salta directamente a la Etapa 4 (Decisión), reduciendo el tiempo de procesamiento de días a minutos.

#### 3.1 Asignación Inteligente

La visita se programa automáticamente en `visitas_presenciales`, asignándola al cobrador/verificador de la `zona_id` correspondiente al domicilio del cliente para optimizar rutas.

**Tabla involucrada:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `visitas_presenciales` | INSERT | `solicitud_id`, `cliente_id`, `verificador_id`, `tipo_visita = 'VERIFICACION'`, `estado_visita = 'PROGRAMADA'` |

#### 3.2 Ejecución con Evidencia — Geolocalización

Al llegar al domicilio, el verificador realiza check-in desde la app. El sistema captura las coordenadas GPS:

| Tabla | Operación | Campos clave |
|---|---|---|
| `evidencias` | INSERT | `visita_id`, `tipo_evidencia = 'GEOLOCALIZACION'`, `lat`, `lon` |
| `visitas_presenciales` | UPDATE | `fecha_ejecutada`, `estado_visita = 'EN_CURSO'` |

> [!CAUTION]
> **Regla Antifraude: Validación GPS.** El sistema compara las coordenadas registradas contra la dirección declarada del cliente. Si la distancia excede un umbral configurable, se genera una alerta en `audit_logs` para el Supervisor. Esto previene el fraude de "verificación desde casa".

#### 3.3 Ejecución con Evidencia — Referencias de Entorno

El verificador completa un formulario digital estructurado (no comentarios libres en WhatsApp):

| Tabla | Operación | Campos booleanos |
|---|---|---|
| `referencias_entorno` | INSERT | `buen_pagador`, `problemas_pago`, `otros_prestamistas`, `vivienda_propia`, `negocio_visible`, `comentarios_vecinos`, `notas_verificador` |

#### 3.4 Ejecución con Evidencia — Fotos

Las fotos de fachada y negocio se suben directamente al expediente digital del cliente:

| Tabla | Operación | Campos clave |
|---|---|---|
| `evidencias` | INSERT (múltiples) | `tipo_evidencia = 'FOTO_FACHADA'` / `'FOTO_NEGOCIO'`, `url_archivo` |

> [!TIP]
> **Mejora: Centralización de evidencia.** Antes, las fotos se enviaban al chat personal del supervisor. Ahora quedan vinculadas al registro `visita_id`, disponibles para auditoría y no dependen de la retención del dispositivo personal.

---

### Etapa 4 — Decisión y Aprobación

| Atributo | Valor |
|---|---|
| **Actores** | Supervisor |
| **SLA** | Diario (cierre de evaluaciones del día) |
| **Estado resultante** | `APROBADA` / `RECHAZADA` / `OBSERVADA` |

#### 4.1 Tablero de Decisión

El Supervisor accede a una vista consolidada de toda la información del solicitante en una sola pantalla:

| Componente | Fuente |
|---|---|
| Score Crediticio | `seeker_resultados.score` + `resumen_deudas` |
| Fotos de Visita | `evidencias` (filtradas por `visita_id`) |
| Mapa GPS del domicilio | `evidencias.lat`, `evidencias.lon` |
| Referencias vecinales | `referencias_entorno` |
| Historial de créditos previos | `prestamos` (por `cliente_id`) |
| Documentos del solicitante | `documentos_solicitud` |

#### 4.2 Registro del Dictamen

**Tabla involucrada:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `revisiones_supervisor` | INSERT | `solicitud_id`, `supervisor_id`, `dictamen`, `monto_aprobado`, `tasa_aprobada`, `plazo_aprobado`, `motivo` |
| `solicitudes_prestamo` | UPDATE | `estado` → valor según dictamen |

**Valores del dictamen y transiciones:**

| Dictamen | Estado `solicitudes_prestamo` | Acción posterior |
|---|---|---|
| `APROBADO` | → `APROBADA` → `EN_FORMALIZACION` | Notificación al cliente + paso a Etapa 5 |
| `RECHAZADO` | → `RECHAZADA` | Notificación automática de cierre |
| `OBSERVADO` | → `OBSERVADA` | Solicitud devuelta para información adicional |

> [!IMPORTANT]
> **Traza de auditoría.** Cada dictamen se registra en `revisiones_supervisor` con `supervisor_id` y `motivo`. Esto crea la evidencia de por qué se aprobó o rechazó un crédito, necesaria para auditorías internas y regulatorias.

#### 4.3 Notificaciones Automáticas de Cierre

| Resultado | Canal | Contenido |
|---|---|---|
| Aprobado | WhatsApp / SMS | Confirmación + instrucciones para firma |
| Rechazado | WhatsApp / SMS | Mensaje plantilla: "No califica por política interna" |

**Tabla involucrada:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `notificaciones` | INSERT | `tipo_notificacion = 'ESTADO_CREDITO'`, `canal`, `contenido`, `estado = 'PENDIENTE'` |

> [!TIP]
> **Mejora: Cierre automático de tickets.** La notificación de rechazo automatizada evita que el asesor pierda tiempo en re-consultas de clientes que ya fueron denegados.

---

### Etapa 5 — Formalización y Desembolso

| Atributo | Valor |
|---|---|
| **Actores** | Asesor Comercial / Tesorería / Administrador |
| **SLA** | Post-aprobación inmediata |
| **Estado resultante** | Creación de registro `prestamos` con `estado = 'PENDIENTE_DESEMBOLSO'` → `'ACTIVO'` |

#### 5.1 Generación de Contratos

Al aprobarse la solicitud, el sistema genera automáticamente:

| Tabla | Operación | Registros creados |
|---|---|---|
| `prestamos` | INSERT | `solicitud_id`, `monto_capital`, `monto_interes`, `monto_total_pagar`, `saldo_pendiente`, `estado = 'PENDIENTE_DESEMBOLSO'` |
| `contratos` | INSERT (×2) | `tipo_contrato = 'CONTRATO_PRESTAMO'` + `tipo_contrato = 'PAGARE'`, `estado = 'GENERADO'` |
| `cuotas_programadas` | INSERT (×N) | Cronograma según `tipo_cronograma` |

#### 5.2 Proceso de Firma

| Opción | Flujo |
|---|---|
| **A — Firma Física (actual)** | Se imprime el contrato, el cliente firma, el asesor sube la foto del documento firmado a `contratos.url_archivo`. El contrato transiciona a `estado = 'SUBIDO'`. |
| **B — Firma Digital (futura)** | Firma biométrica o digital directa en la app. |

> [!WARNING]
> **Requisito bloqueante.** El contrato firmado (`contratos.url_archivo IS NOT NULL` y `contratos.firmado = TRUE`) es un **requisito bloqueante** para desembolsar. El sistema no permite que Tesorería proceda sin este documento.

#### 5.3 Validación Pre-Desembolso (Control de Calidad)

Tesorería recibe la alerta de que un crédito está listo para desembolso. Antes de transferir, debe:

1. **Validar visualmente** que la foto del contrato/pagaré sea legible.
2. **Verificar** que el documento esté firmado y corresponda al DNI del solicitante.
3. **Decisión:**
   - ✅ **Validar:** `contratos.validado_por_tesoreria = TRUE` → procede a desembolso.
   - ❌ **Devolver:** `contratos.estado = 'DEVUELTO'` + `motivo_devolucion` → notificación automática al asesor vía Activity Feed.

**Tabla involucrada:**

| Tabla | Operación | Campos clave |
|---|---|---|
| `contratos` | UPDATE | `validado_por_tesoreria`, `validado_por`, `estado` → `'VALIDADO'` / `'DEVUELTO'` |

#### 5.4 Desembolso Controlado

Solo tras la validación exitosa de Tesorería:

| Tabla | Operación | Campos clave |
|---|---|---|
| `desembolsos` | INSERT | `prestamo_id`, `tesorero_id`, `monto`, `medio_desembolso`, `numero_operacion`, `url_comprobante` |
| `prestamos` | UPDATE | `estado` → `'ACTIVO'`, `fecha_desembolso` |

#### 5.5 Custodia de Títulos Valores (Cierre del Día)

Al final del día, el Asesor debe entregar los pagarés físicos al Administrador:

| Tabla | Operación | Campos clave |
|---|---|---|
| `recepcion_pagares` | INSERT (al generar contrato) | `contrato_id`, `prestamo_id`, `asesor_id`, `recibido = FALSE`, `estado = 'PENDIENTE'` |
| `recepcion_pagares` | UPDATE (al recibir) | `recibido_por`, `fecha_recepcion`, `recibido = TRUE`, `estado = 'RECIBIDO'` |

> [!CAUTION]
> **Regla de Control: Bloqueo de Comisiones.** Si `recepcion_pagares.recibido = FALSE`, el sistema **bloquea el cálculo de comisiones** del asesor (`comisiones.estado` no avanza a `'CALCULADA'`). Esto asegura que el pagaré original — necesario como título valor para procesos judiciales futuros — no se pierda.

---

## Resumen de Tablas por Etapa

| Etapa | Tablas principales | Tablas de soporte |
|---|---|---|
| 1. Solicitud | `solicitudes_prestamo`, `clientes`, `documentos_solicitud` | `audit_logs` |
| 2. Evaluación | `seeker_resultados` | `referencias_entorno` (históricas), `audit_logs` |
| 3. Verificación | `visitas_presenciales`, `evidencias`, `referencias_entorno` | `asignaciones_zona`, `zonas` |
| 4. Decisión | `revisiones_supervisor` | `notificaciones`, `audit_logs` |
| 5. Formalización | `prestamos`, `contratos`, `cuotas_programadas`, `desembolsos`, `recepcion_pagares` | `notificaciones`, `comisiones`, `audit_logs` |

---

## Resumen de SLAs

| Etapa | Tiempo objetivo | Responsable |
|---|---|---|
| Solicitud y Pre-Filtrado | Inmediato | Asesor / Bot |
| Evaluación Automática | < 5 minutos | Sistema |
| Verificación en Campo | 24–48 horas | Verificador |
| Decisión y Aprobación | Mismo día (cierre diario) | Supervisor |
| Formalización y Desembolso | Post-aprobación inmediata | Asesor + Tesorería |
| **Total (cliente nuevo)** | **< 72 horas** | — |
| **Total (renovación express)** | **< 1 hora** | — |

---

## Índice de Reglas Antifraude

| # | Regla | Etapa | Acción |
|---|---|---|---|
| AF-01 | Validación biométrica fallida | 1 | Rechazo automático irreversible |
| AF-02 | Score Seeker bajo umbral | 2 | Rechazo automático con notificación |
| AF-03 | Historial interno de "problemas de pago" | 2 | Alerta de riesgo antes de campo |
| AF-04 | Distancia GPS vs. dirección declarada | 3 | Alerta a Supervisor + registro en audit_logs |
| AF-05 | Foto de contrato borrosa/no coincide con DNI | 5 | Devolución a asesor, bloqueo de desembolso |
| AF-06 | Pagaré no entregado al cierre del día | 5 | Bloqueo de comisiones del asesor |