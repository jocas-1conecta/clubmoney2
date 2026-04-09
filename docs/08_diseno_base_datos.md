# Diseño de Base de Datos — ClubMoney (PostgreSQL / Supabase)

> **Versión:** 1.0  
> **Fecha:** 2026-03-28  
> **Enfoque:** Normalizado Relacional (3NF) + JSONB Estratégico  
> **Motor:** PostgreSQL (Supabase)  
> **Moneda:** PEN (Soles Peruanos) — exclusiva  
> **Política de eliminación:** ZERO-DELETE (solo cambios de estado, jamás DELETE)

---

## Resumen Ejecutivo

Base de datos para un ecosistema de gestión de microcréditos con cobranza diaria en campo. Reemplaza la operación manual basada en libretas físicas, WhatsApp personal y coordinación verbal. Cubre desde la originación del crédito hasta la recuperación de morosidad, con trazabilidad total del efectivo y auditoría inmutable.

### Principios de Diseño

1. **NUMERIC(10,2)** para toda columna monetaria. Prohibido FLOAT/REAL.
2. **Zero-delete:** Todo registro permanece. Se gestiona por columna `estado`.
3. **Timestamps universales:** `created_at` y `updated_at` (TIMESTAMPTZ) en todas las tablas.
4. **Almacenamiento UTC:** Zona horaria de Perú (UTC-5) manejada en presentación.
5. **RLS obligatorio:** Políticas Row Level Security en todas las tablas.
6. **Audit trail inmutable:** Tabla `audit_logs` append-only con trigger de protección.
7. **Archivos en Supabase Storage:** Buckets por tipo (`documentos`, `evidencias`, `vouchers`, `billetes`, `contratos`).

---

## Convenciones

- **PK:** Todas las tablas usan `id UUID DEFAULT gen_random_uuid()`.
- **FK:** Nombradas como `tabla_referenciada_id`.
- **Estados:** Columna `estado VARCHAR(30)` con valores ENUM documentados por tabla.
- **Timestamps:** `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Nullable:** Se indica explícitamente. Por defecto, los campos son NOT NULL.

---

## CAPA 1 — Fundación (Usuarios, Roles, Permisos, Zonas, Configuración)

### `perfiles`
Extiende `auth.users` de Supabase con datos operativos del empleado.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK, FK → auth.users.id | Identificador sincronizado con Supabase Auth |
| dni | VARCHAR(8) | UNIQUE NOT NULL, CHECK(LENGTH=8) | Documento Nacional de Identidad |
| nombre_completo | TEXT | NOT NULL | Nombre legal completo |
| telefono | VARCHAR(15) | | Teléfono principal |
| email | TEXT | | Correo electrónico |
| foto_url | TEXT | | URL en Supabase Storage |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | ACTIVO / INACTIVO / SUSPENDIDO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `roles`
Catálogo de los 6 roles del sistema.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| nombre | VARCHAR(50) | UNIQUE NOT NULL | ASESOR_COMERCIAL, COBRADOR_VERIFICADOR, SUPERVISOR, TESORERIA, ASESOR_ADMINISTRATIVO, GERENCIA |
| descripcion | TEXT | | Descripción del rol |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | ACTIVO / INACTIVO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `permisos`
Catálogo de permisos atómicos del sistema.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| codigo | VARCHAR(100) | UNIQUE NOT NULL | Ej. CREAR_SOLICITUD, APROBAR_CREDITO, REVERTIR_PAGO |
| modulo | VARCHAR(50) | NOT NULL | ORIGINACION, COBRANZA, CONSOLIDACION, MOROSIDAD, etc. |
| descripcion | TEXT | | |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `rol_permisos`
Permisos heredados por rol (M:M).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| rol_id | UUID | FK → roles.id, NOT NULL | |
| permiso_id | UUID | FK → permisos.id, NOT NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraint:** UNIQUE(rol_id, permiso_id)

### `usuario_roles`
Roles asignados a cada usuario (M:M). Un usuario puede acumular múltiples roles.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| usuario_id | UUID | FK → perfiles.id, NOT NULL | |
| rol_id | UUID | FK → roles.id, NOT NULL | |
| asignado_por | UUID | FK → perfiles.id | Quién asignó el rol |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraint:** UNIQUE(usuario_id, rol_id)  
**Audit:** INSERT/cambios → audit_logs

### `usuario_permisos`
Overrides granulares por persona (grant/deny individual).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| usuario_id | UUID | FK → perfiles.id, NOT NULL | |
| permiso_id | UUID | FK → permisos.id, NOT NULL | |
| tipo | VARCHAR(10) | NOT NULL | GRANT / DENY |
| motivo | TEXT | | Razón del override |
| asignado_por | UUID | FK → perfiles.id | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraint:** UNIQUE(usuario_id, permiso_id)  
**Lógica:** Permisos efectivos = (∪ permisos de roles) + (grants individuales) − (denials individuales)  
**Audit:** INSERT/cambios → audit_logs

### `zonas`
Catálogo de zonas geográficas operativas.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| nombre | VARCHAR(100) | NOT NULL | Ej. "Zona Norte", "Centro" |
| descripcion | TEXT | | |
| estado | VARCHAR(20) | DEFAULT 'ACTIVA' | ACTIVA / INACTIVA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `asignaciones_zona`
Relación dinámica cobrador ↔ zona con historial.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| usuario_id | UUID | FK → perfiles.id, NOT NULL | |
| zona_id | UUID | FK → zonas.id, NOT NULL | |
| fecha_inicio | DATE | NOT NULL | |
| fecha_fin | DATE | nullable | NULL = asignación vigente |
| activo | BOOLEAN | DEFAULT TRUE | |
| asignado_por | UUID | FK → perfiles.id | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS:** El cobrador solo ve clientes/rutas de sus zonas activas.

### `configuracion_sistema`
Parámetros editables desde el panel administrativo (key-value).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| clave | VARCHAR(100) | NOT NULL | Ej. LIMITE_EFECTIVO_MANO, DIAS_TOLERANCIA_MORA |
| valor | JSONB | NOT NULL | Valor del parámetro |
| tipo_dato | VARCHAR(20) | NOT NULL | NUMBER, STRING, BOOLEAN, JSON |
| descripcion | TEXT | | Descripción legible |
| zona_id | UUID | FK → zonas.id, nullable | NULL = configuración global |
| actualizado_por | UUID | FK → perfiles.id | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraint:** UNIQUE(clave, zona_id)  
**Lógica:** Consultar zona_id específico primero → fallback a global (zona_id IS NULL)  
**Audit:** UPDATE → audit_logs

---

## CAPA 2 — Clientes y Originación de Crédito

### `clientes`
Registro maestro del deudor.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| dni | VARCHAR(8) | UNIQUE NOT NULL, CHECK(LENGTH=8) | DNI peruano |
| nombre_completo | TEXT | NOT NULL | |
| telefono | VARCHAR(15) | | Teléfono principal |
| telefono_secundario | VARCHAR(15) | | |
| email | TEXT | | |
| direccion | TEXT | | Dirección domiciliaria |
| referencia_direccion | TEXT | | Referencias para ubicar |
| zona_id | UUID | FK → zonas.id | Zona por domicilio |
| es_cliente_recurrente | BOOLEAN | DEFAULT FALSE | Actualizado por el sistema |
| calificacion_interna | VARCHAR(20) | | EXCELENTE / BUENO / REGULAR / MALO |
| foto_url | TEXT | | |
| registrado_por | UUID | FK → perfiles.id | Asesor que registró |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | ACTIVO / INACTIVO / BLOQUEADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `solicitudes_prestamo`
Pipeline de evaluación crediticia. Separada de `prestamos` para mantener la tabla financiera limpia.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| asesor_id | UUID | FK → perfiles.id, NOT NULL | Quien ingresó la solicitud |
| monto_solicitado | NUMERIC(10,2) | NOT NULL | |
| plazo_dias | INTEGER | NOT NULL | |
| tasa_interes | NUMERIC(5,2) | NOT NULL | Porcentaje |
| tipo_cronograma | VARCHAR(20) | NOT NULL | FIJO / FLEXIBLE / HIBRIDO |
| es_renovacion | BOOLEAN | DEFAULT FALSE | |
| prestamo_anterior_id | UUID | FK → prestamos.id, nullable | Si es renovación |
| requiere_verificacion_campo | BOOLEAN | DEFAULT TRUE | FALSE = Bypass Renovación Express |
| validacion_biometrica_ok | BOOLEAN | DEFAULT FALSE | Resultado RENIEC/biometría |
| motivo_rechazo | TEXT | nullable | |
| estado | VARCHAR(30) | DEFAULT 'INGRESADA' | INGRESADA → EN_EVALUACION → VERIFICACION_CAMPO → APROBADA / RECHAZADA / OBSERVADA → EN_FORMALIZACION |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** Cambios de estado → audit_logs

### `documentos_solicitud`
Evidencia documental del solicitante.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| solicitud_id | UUID | FK → solicitudes_prestamo.id, NOT NULL | |
| tipo_documento | VARCHAR(50) | NOT NULL | DNI_FRONTAL, DNI_REVERSO, RECIBO_LUZ, CONTRATO_ALQUILER, SELFIE, PRUEBA_VIDA |
| url_archivo | TEXT | NOT NULL | URL en Supabase Storage |
| estado_validacion | VARCHAR(20) | DEFAULT 'RECIBIDO' | RECIBIDO / VALIDADO / RECHAZADO / BORROSO |
| validado_por | UUID | FK → perfiles.id, nullable | |
| notas | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `seeker_resultados`
Respuesta de central de riesgo (Seeker API).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| solicitud_id | UUID | FK → solicitudes_prestamo.id, NOT NULL | |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| score | INTEGER | | Score crediticio |
| resumen_deudas | JSONB | | Datos estructurados de riesgo |
| resultado_raw | JSONB | | Respuesta cruda de la API |
| fecha_consulta | TIMESTAMPTZ | DEFAULT NOW() | |
| estado | VARCHAR(20) | DEFAULT 'PROCESADO' | PROCESADO / ERROR / PENDIENTE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `visitas_presenciales`
Verificaciones de campo y visitas de cobranza (tabla compartida).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| solicitud_id | UUID | FK → solicitudes_prestamo.id, nullable | Para verificaciones |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| verificador_id | UUID | FK → perfiles.id, NOT NULL | |
| tipo_visita | VARCHAR(30) | NOT NULL | VERIFICACION / COBRANZA / RECUPERACION |
| lat | NUMERIC(10,7) | | Latitud GPS (capturada del dispositivo) |
| lon | NUMERIC(10,7) | | Longitud GPS |
| fecha_programada | TIMESTAMPTZ | | |
| fecha_ejecutada | TIMESTAMPTZ | | Timestamp del dispositivo (no del servidor) |
| estado_visita | VARCHAR(30) | DEFAULT 'PROGRAMADA' | PROGRAMADA / EN_CURSO / COMPLETADA / AUSENTE / SIN_DINERO / REPROGRAMADA |
| notas | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `evidencias`
Archivos georeferenciados de visita.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| visita_id | UUID | FK → visitas_presenciales.id, NOT NULL | |
| tipo_evidencia | VARCHAR(30) | NOT NULL | FOTO_FACHADA, FOTO_NEGOCIO, FOTO_DNI, GEOLOCALIZACION, VIDEO |
| url_archivo | TEXT | | URL en Supabase Storage |
| lat | NUMERIC(10,7) | | |
| lon | NUMERIC(10,7) | | |
| metadata | JSONB | | Datos adicionales |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `referencias_entorno`
Formulario de verificación vecinal (campos booleanos para analítica futura).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| visita_id | UUID | FK → visitas_presenciales.id, NOT NULL | |
| solicitud_id | UUID | FK → solicitudes_prestamo.id, NOT NULL | |
| buen_pagador | BOOLEAN | | Referencia vecinal positiva |
| problemas_pago | BOOLEAN | | Antecedentes negativos |
| otros_prestamistas | BOOLEAN | | Tiene otros acreedores |
| vivienda_propia | BOOLEAN | | |
| negocio_visible | BOOLEAN | | |
| comentarios_vecinos | TEXT | | |
| notas_verificador | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `revisiones_supervisor`
Dictamen del comité de crédito.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| solicitud_id | UUID | FK → solicitudes_prestamo.id, NOT NULL | |
| supervisor_id | UUID | FK → perfiles.id, NOT NULL | |
| dictamen | VARCHAR(20) | NOT NULL | APROBADO / RECHAZADO / OBSERVADO |
| monto_aprobado | NUMERIC(10,2) | | |
| tasa_aprobada | NUMERIC(5,2) | | |
| plazo_aprobado | INTEGER | | |
| condiciones_especiales | TEXT | | |
| motivo | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** INSERT → audit_logs

---

## CAPA 3 — Formalización, Préstamos y Desembolso

### `prestamos`
Entidad financiera central. Solo se crea tras aprobación.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| solicitud_id | UUID | FK → solicitudes_prestamo.id, NOT NULL | |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| zona_id | UUID | FK → zonas.id | |
| asesor_id | UUID | FK → perfiles.id | |
| grupo_credito_id | UUID | NOT NULL | Expediente de deuda. Generado en primer préstamo, heredado en novaciones |
| prestamo_origen_id | UUID | FK → prestamos.id, nullable | Cadena padre→hijo para refinanciamiento |
| monto_capital | NUMERIC(10,2) | NOT NULL | Capital puro prestado |
| monto_interes | NUMERIC(10,2) | NOT NULL | Interés total calculado |
| monto_total_pagar | NUMERIC(10,2) | NOT NULL | Capital + Interés |
| saldo_pendiente | NUMERIC(10,2) | NOT NULL | Se actualiza con cada pago conciliado |
| tasa_interes | NUMERIC(5,2) | NOT NULL | Porcentaje |
| plazo_dias | INTEGER | NOT NULL | |
| tipo_cronograma | VARCHAR(20) | NOT NULL | FIJO / FLEXIBLE / HIBRIDO |
| cuota_diaria | NUMERIC(10,2) | nullable | Para FIJO |
| cuota_minima_sugerida | NUMERIC(10,2) | nullable | Para HIBRIDO |
| fecha_desembolso | DATE | | |
| fecha_vencimiento | DATE | NOT NULL | |
| fecha_cancelacion | TIMESTAMPTZ | nullable | |
| estado | VARCHAR(30) | DEFAULT 'PENDIENTE_DESEMBOLSO' | PENDIENTE_DESEMBOLSO → ACTIVO → CANCELADO / CANCELADO_POR_REFINANCIACION / VENCIDO / EN_MORA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** Cambios de estado, actualización de saldo → audit_logs

### `cuotas_programadas`
Cronograma de pagos esperados.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| numero_cuota | INTEGER | NOT NULL | |
| fecha_programada | DATE | NOT NULL | |
| monto_cuota | NUMERIC(10,2) | NOT NULL | |
| monto_pagado | NUMERIC(10,2) | DEFAULT 0 | |
| es_sugerida | BOOLEAN | DEFAULT FALSE | TRUE en HIBRIDO (referencial, no estricta) |
| estado | VARCHAR(20) | DEFAULT 'PENDIENTE' | PENDIENTE / PARCIAL / PAGADA / VENCIDA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Regla:** FLEXIBLE = 0 filas. FIJO = N filas iguales. HIBRIDO = N filas con es_sugerida=TRUE.

### `contratos`
Documentos legales generados y firmados.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| tipo_contrato | VARCHAR(30) | NOT NULL | CONTRATO_PRESTAMO / PAGARE |
| url_archivo_generado | TEXT | | PDF generado por sistema |
| url_archivo | TEXT | nullable | Foto/scan del documento firmado |
| firmado | BOOLEAN | DEFAULT FALSE | |
| fecha_firma | TIMESTAMPTZ | | |
| validado_por_tesoreria | BOOLEAN | DEFAULT FALSE | |
| validado_por | UUID | FK → perfiles.id, nullable | |
| motivo_devolucion | TEXT | | Si foto borrosa o dudosa |
| estado | VARCHAR(20) | DEFAULT 'GENERADO' | GENERADO → SUBIDO → VALIDADO / DEVUELTO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Evento:** Estado DEVUELTO → mensaje automático en Activity Feed para notificar al asesor.

### `recepcion_pagares`
Cadena de custodia del título valor físico.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| contrato_id | UUID | FK → contratos.id, NOT NULL | Del tipo PAGARE |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| asesor_id | UUID | FK → perfiles.id, NOT NULL | Quién debe entregar |
| recibido_por | UUID | FK → perfiles.id, nullable | Admin que recibe |
| fecha_entrega | TIMESTAMPTZ | nullable | |
| fecha_recepcion | TIMESTAMPTZ | nullable | |
| recibido | BOOLEAN | DEFAULT FALSE | **El check que bloquea comisiones** |
| notas | TEXT | | |
| estado | VARCHAR(20) | DEFAULT 'PENDIENTE' | PENDIENTE / RECIBIDO / EXTRAVIADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `desembolsos`
Registro de la transferencia de dinero al cliente.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| tesorero_id | UUID | FK → perfiles.id, NOT NULL | |
| monto | NUMERIC(10,2) | NOT NULL | |
| medio_desembolso | VARCHAR(30) | NOT NULL | TRANSFERENCIA_BANCARIA / EFECTIVO |
| banco_destino | VARCHAR(50) | | |
| cuenta_destino | VARCHAR(30) | | |
| numero_operacion | VARCHAR(50) | | |
| url_comprobante | TEXT | | |
| fecha_desembolso | TIMESTAMPTZ | NOT NULL | |
| estado | VARCHAR(20) | DEFAULT 'EJECUTADO' | EJECUTADO / ANULADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** INSERT, estado ANULADO → audit_logs

---

## CAPA 4 — Cobranza Diaria

### `rutas_cobranza`
Plan de trabajo diario del cobrador.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| cobrador_id | UUID | FK → perfiles.id, NOT NULL | |
| zona_id | UUID | FK → zonas.id, NOT NULL | |
| fecha_ruta | DATE | NOT NULL | |
| total_clientes | INTEGER | DEFAULT 0 | |
| total_recaudado | NUMERIC(10,2) | DEFAULT 0 | |
| saldo_mano | NUMERIC(10,2) | DEFAULT 0 | Efectivo acumulado en campo (monitoreado vs LIMITE_EFECTIVO_MANO) |
| saldo_inicial_custodia | NUMERIC(10,2) | DEFAULT 0 | Arrastrado del día anterior si hubo Cierre con Custodia |
| hora_inicio | TIMESTAMPTZ | | |
| hora_cierre | TIMESTAMPTZ | | |
| url_voucher_deposito | TEXT | | Foto del depósito global del día |
| aprobado_custodia_por | UUID | FK → perfiles.id, nullable | Supervisor que autorizó custodia |
| estado | VARCHAR(20) | DEFAULT 'PLANIFICADA' | PLANIFICADA → EN_CURSO → CERRADA / CIERRE_CON_CUSTODIA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `ruta_clientes`
Cada cliente en la ruta del día.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| ruta_id | UUID | FK → rutas_cobranza.id, NOT NULL | |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| orden_visita | INTEGER | NOT NULL | Prioridad calculada por sistema |
| monto_esperado | NUMERIC(10,2) | | Monto de cuota esperada |
| monto_cobrado | NUMERIC(10,2) | DEFAULT 0 | |
| prioridad | VARCHAR(20) | DEFAULT 'NORMAL' | NORMAL / ALTA / URGENTE (morosos) |
| instruccion_especial | TEXT | | Ej. "Recuperación / Notificación de Embargo" |
| estado_visita | VARCHAR(30) | DEFAULT 'PENDIENTE' | PENDIENTE / VISITADO / AUSENTE / SIN_DINERO / COBRADO / PAGO_PARCIAL |
| fecha_visita | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `pagos`
Registro transaccional de cada cobro.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| cuota_id | UUID | FK → cuotas_programadas.id, nullable | Vincula con cronograma si aplica |
| ruta_cliente_id | UUID | FK → ruta_clientes.id, nullable | Nullable: pago podría registrarse en oficina |
| cobrador_id | UUID | FK → perfiles.id, nullable | |
| monto | NUMERIC(10,2) | NOT NULL | |
| medio_pago | VARCHAR(30) | NOT NULL | EFECTIVO / YAPE / PLIN / TRANSFERENCIA_BANCARIA |
| fecha_pago | TIMESTAMPTZ | NOT NULL | Hora real del dispositivo (modo offline) |
| fecha_registro | TIMESTAMPTZ | DEFAULT NOW() | Hora de inserción en servidor |
| numero_operacion | VARCHAR(50) | | Para pagos digitales |
| banco_origen | VARCHAR(50) | | |
| lat | NUMERIC(10,7) | | GPS del cobro |
| lon | NUMERIC(10,7) | | |
| sync_pending | BOOLEAN | DEFAULT FALSE | Cola de sincronización offline |
| motivo_anulacion | TEXT | nullable | |
| estado | VARCHAR(30) | DEFAULT 'REGISTRADO' | REGISTRADO → RECAUDADO_EN_CAMPO → PENDIENTE_CONCILIACION → CONCILIADO / ANULADO / EXTORNADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** INSERT, cambios de estado (ANULADO, EXTORNADO) → audit_logs  
**Evento:** INSERT → mensaje automático en Activity Feed

### `registro_billetes`
Trazabilidad individual por billete físico.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| pago_id | UUID | FK → pagos.id, NOT NULL | |
| numero_serie | VARCHAR(30) | NOT NULL, INDEX | Número de serie del billete |
| denominacion | NUMERIC(10,2) | NOT NULL | 10, 20, 50, 100, 200 |
| foto_url | TEXT | NOT NULL | |
| registrado_por | UUID | FK → perfiles.id, NOT NULL | |
| validado_por | UUID | FK → perfiles.id, nullable | Tesorería |
| fecha_validacion | TIMESTAMPTZ | nullable | |
| motivo_rechazo | TEXT | nullable | |
| estado | VARCHAR(20) | DEFAULT 'REGISTRADO_CAMPO' | REGISTRADO_CAMPO → VALIDADO_TESORERIA / RECHAZADO / SOSPECHOSO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Índice antifraude:** INDEX sobre `numero_serie`. Trigger alerta si ya existe en registros previos (previene reciclaje).  
**Audit:** Estado RECHAZADO/SOSPECHOSO → audit_logs

### `vouchers`
Comprobantes de pago digital con extracción OCR.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| pago_id | UUID | FK → pagos.id, NOT NULL | |
| url_archivo | TEXT | NOT NULL | |
| id_operacion_extraido | VARCHAR(50) | | OCR: ID de operación |
| banco_extraido | VARCHAR(50) | | OCR: banco |
| monto_extraido | NUMERIC(10,2) | | OCR: monto |
| emisor_extraido | TEXT | | OCR: emisor |
| procesado_ocr | BOOLEAN | DEFAULT FALSE | |
| resultado_ocr_raw | JSONB | | Respuesta cruda del servicio OCR |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `cuadernos_cliente`
Libreta digital por préstamo (uno por préstamo).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| prestamo_id | UUID | FK → prestamos.id, UNIQUE | Un cuaderno por préstamo |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| saldo_actual | NUMERIC(10,2) | NOT NULL | |
| total_pagado | NUMERIC(10,2) | DEFAULT 0 | |
| ultimo_pago_fecha | TIMESTAMPTZ | nullable | |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | ACTIVO / CERRADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `registros_cuaderno`
Entradas cronológicas de la bitácora (Activity Log financiero del cliente).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| cuaderno_id | UUID | FK → cuadernos_cliente.id, NOT NULL | |
| pago_id | UUID | FK → pagos.id, nullable | Puede existir sin pago (nota de campo) |
| tipo_registro | VARCHAR(30) | NOT NULL | PAGO / NOTA_CAMPO / VISITA_FALLIDA / AJUSTE / NOTIFICACION_ENVIADA |
| descripcion | TEXT | | Texto narrativo |
| monto | NUMERIC(10,2) | nullable | |
| saldo_anterior | NUMERIC(10,2) | | Snapshot del saldo antes |
| saldo_nuevo | NUMERIC(10,2) | | Snapshot del saldo después |
| registrado_por | UUID | FK → perfiles.id | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## CAPA 5 — Consolidación y Conciliación de Pagos

### `movimientos_bancarios`
Transacciones reales del banco importadas.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| lote_importacion_id | UUID | | Agrupa transacciones de una misma carga |
| cuenta_bancaria | VARCHAR(30) | NOT NULL | |
| banco | VARCHAR(50) | NOT NULL | |
| fecha_movimiento | DATE | NOT NULL | |
| monto | NUMERIC(10,2) | NOT NULL | |
| referencia | VARCHAR(100) | | Número de operación bancaria |
| tipo_movimiento | VARCHAR(20) | | ABONO / CARGO |
| origen | VARCHAR(30) | | IMPORTACION_ARCHIVO / MANUAL |
| importado_por | UUID | FK → perfiles.id | |
| estado | VARCHAR(20) | DEFAULT 'PENDIENTE' | PENDIENTE → CONCILIADO / SIN_COINCIDENCIA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `conciliaciones`
Batch de conciliación (uno por ejecución).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| fecha_conciliacion | DATE | NOT NULL | |
| ejecutado_por | UUID | FK → perfiles.id, nullable | NULL = proceso automático |
| tipo | VARCHAR(20) | DEFAULT 'AUTOMATICA' | AUTOMATICA / MANUAL |
| total_procesados | INTEGER | DEFAULT 0 | |
| total_exitosos | INTEGER | DEFAULT 0 | |
| total_fallidos | INTEGER | DEFAULT 0 | |
| estado | VARCHAR(20) | DEFAULT 'EN_PROCESO' | EN_PROCESO → FINALIZADA → CERRADA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Bloqueo:** Estado CERRADA = ningún registro hijo puede modificarse (cierre contable).

### `conciliacion_detalle`
Resultado del cruce pago ↔ movimiento bancario.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| conciliacion_id | UUID | FK → conciliaciones.id, NOT NULL | |
| pago_id | UUID | FK → pagos.id, NOT NULL | |
| movimiento_bancario_id | UUID | FK → movimientos_bancarios.id, nullable | Nullable: pago sin contraparte |
| coincide | BOOLEAN | DEFAULT FALSE | |
| monto_pago | NUMERIC(10,2) | | |
| monto_banco | NUMERIC(10,2) | nullable | |
| diferencia | NUMERIC(10,2) | | |
| notas | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `inconsistencias_pago`
Discrepancias aisladas para gestión humana.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| conciliacion_id | UUID | FK → conciliaciones.id, NOT NULL | |
| pago_id | UUID | FK → pagos.id, NOT NULL | |
| movimiento_bancario_id | UUID | FK → movimientos_bancarios.id, nullable | |
| tipo_inconsistencia | VARCHAR(50) | NOT NULL | MONTO_DIFIERE / VOUCHER_ILEGIBLE / DEPOSITO_NO_FIGURA / PAGO_SIN_MOVIMIENTO / MOVIMIENTO_SIN_PAGO / BILLETE_RECHAZADO |
| descripcion | TEXT | | |
| resolucion | TEXT | | Motivo de resolución |
| resuelto_por | UUID | FK → perfiles.id, nullable | |
| fecha_resolucion | TIMESTAMPTZ | nullable | |
| estado | VARCHAR(20) | DEFAULT 'ABIERTA' | ABIERTA → EN_REVISION → RESUELTA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

## CAPA 6 — Gestión de Morosidad y Refinanciamiento

### `casos_morosidad`
Caso de atraso generado automáticamente por batch diario (6:00 AM).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| prestamo_id | UUID | FK → prestamos.id, NOT NULL | |
| cliente_id | UUID | FK → clientes.id, NOT NULL | |
| dias_sin_pago | INTEGER | NOT NULL | Calculado diariamente por batch |
| monto_vencido | NUMERIC(10,2) | NOT NULL | |
| fecha_inicio_mora | DATE | NOT NULL | Primer día de incumplimiento |
| categoria_mora | VARCHAR(30) | NOT NULL | MORA_TEMPRANA / MORA_MEDIA / MORA_GRAVE / PREJURIDICO (umbrales de configuracion_sistema) |
| asignado_a | UUID | FK → perfiles.id | Asesor Administrativo responsable |
| tiene_promesa_pago | BOOLEAN | DEFAULT FALSE | |
| fecha_promesa_pago | DATE | nullable | Si llega sin pago → alerta inmediata |
| estado | VARCHAR(20) | DEFAULT 'ABIERTO' | ABIERTO → EN_GESTION → RECUPERADO / REFINANCIADO / ESCALADO_CAMPO / CASTIGO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** Cambios de estado, reclasificación de categoría → audit_logs

### `acciones_morosidad`
Bitácora de gestiones realizadas sobre cada caso.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| caso_id | UUID | FK → casos_morosidad.id, NOT NULL | |
| ejecutado_por | UUID | FK → perfiles.id, NOT NULL | |
| tipo_accion | VARCHAR(30) | NOT NULL | LLAMADA / WHATSAPP / SMS / EMAIL / VISITA_CAMPO / NOTIFICACION_EMBARGO / PROMESA_PAGO / ACUERDO_PAGO |
| descripcion | TEXT | | Resumen de la conversación |
| resultado | TEXT | | |
| fecha_proxima_accion | TIMESTAMPTZ | nullable | Recordatorio programado |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `novaciones`
Registro contable del refinanciamiento (puente entre préstamo "muerto" y nuevo).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| caso_morosidad_id | UUID | FK → casos_morosidad.id, NOT NULL | |
| supervisor_id | UUID | FK → perfiles.id, NOT NULL | Quién aprobó la negociación |
| prestamo_original_id | UUID | FK → prestamos.id, NOT NULL | El que se "mata" |
| prestamo_nuevo_id | UUID | FK → prestamos.id, NOT NULL | El recién creado |
| capital_remanente | NUMERIC(10,2) | NOT NULL | Capital pendiente |
| interes_pendiente | NUMERIC(10,2) | NOT NULL | Intereses no pagados |
| mora_acumulada | NUMERIC(10,2) | NOT NULL | Penalidades |
| saldo_total_deudor | NUMERIC(10,2) | NOT NULL | Suma de los tres anteriores |
| descuento_condonacion | NUMERIC(10,2) | DEFAULT 0 | Lo que el Supervisor perdona |
| motivo_condonacion | TEXT | | Obligatorio si descuento > 0 |
| capital_nuevo | NUMERIC(10,2) | NOT NULL | saldo_total - descuento = capital del nuevo préstamo |
| condiciones_nuevas | JSONB | | Tasa, plazo, tipo_cronograma del nuevo préstamo |
| estado | VARCHAR(20) | DEFAULT 'PROPUESTA' | PROPUESTA → APROBADA → EJECUTADA / ANULADA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** INSERT, cambios de estado → audit_logs  
**Vintage:** prestamo_original queda CANCELADO_POR_REFINANCIACION (congelado con mora real).  
**Expediente:** prestamo_nuevo hereda grupo_credito_id del original.

---

## CAPA 7 — Comunicación, Notificaciones, Comisiones y Auditoría

### `chats`
Canales y hilos de comunicación.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| tipo_chat | VARCHAR(30) | NOT NULL | CANAL_GENERAL / CANAL_ZONA / HILO_CLIENTE / HILO_MOROSIDAD / HILO_PRESTAMO / DIRECTO |
| nombre | VARCHAR(100) | | Para canales |
| entity_type | VARCHAR(50) | nullable | Ej. 'cliente', 'caso_morosidad', 'prestamo' |
| entity_id | UUID | nullable | ID del registro vinculado |
| zona_id | UUID | FK → zonas.id, nullable | Para canales de zona |
| creado_por | UUID | FK → perfiles.id | |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | ACTIVO / ARCHIVADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `chat_participantes`
Miembros de cada canal/hilo.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| chat_id | UUID | FK → chats.id, NOT NULL | |
| usuario_id | UUID | FK → perfiles.id, NOT NULL | |
| rol_en_chat | VARCHAR(20) | DEFAULT 'MIEMBRO' | MIEMBRO / ADMIN |
| ultima_lectura | TIMESTAMPTZ | | Para calcular no leídos |
| estado | VARCHAR(20) | DEFAULT 'ACTIVO' | ACTIVO / SILENCIADO / REMOVIDO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraint:** UNIQUE(chat_id, usuario_id)

### `mensajes_chat`
Mensajes humanos + eventos automáticos del sistema.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| chat_id | UUID | FK → chats.id, NOT NULL | |
| autor_id | UUID | FK → perfiles.id, nullable | NULL = mensaje del sistema |
| tipo_mensaje | VARCHAR(30) | NOT NULL | TEXTO / IMAGEN / DOCUMENTO / EVENTO_SISTEMA |
| contenido | TEXT | | Texto o descripción del evento |
| url_archivo | TEXT | nullable | Para imágenes/documentos |
| entity_type | VARCHAR(50) | nullable | Deep linking: 'pago', 'prestamo', 'contrato' |
| entity_id | UUID | nullable | ID para navegación directa |
| metadata | JSONB | nullable | Datos de previsualización para rich cards |
| estado | VARCHAR(20) | DEFAULT 'ENVIADO' | ENVIADO / ANULADO |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `notificaciones`
Registro de toda comunicación saliente omnicanal.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| tipo_destinatario | VARCHAR(20) | NOT NULL | CLIENTE / EMPLEADO |
| destinatario_cliente_id | UUID | FK → clientes.id, nullable | |
| destinatario_usuario_id | UUID | FK → perfiles.id, nullable | |
| prestamo_id | UUID | FK → prestamos.id, nullable | |
| caso_morosidad_id | UUID | FK → casos_morosidad.id, nullable | |
| tipo_notificacion | VARCHAR(50) | NOT NULL | CONFIRMACION_PAGO / RECIBO_DIGITAL / ESTADO_CREDITO / ALERTA_MORA_1..7 / ALERTA_INTERNA / DEVOLUCION_CONTRATO |
| canal | VARCHAR(20) | NOT NULL | WHATSAPP / SMS / EMAIL |
| contenido | TEXT | | Mensaje enviado |
| fecha_programada | TIMESTAMPTZ | nullable | |
| fecha_enviada | TIMESTAMPTZ | nullable | |
| proveedor_id_externo | VARCHAR(100) | | Message ID de Twilio/Meta |
| error_detalle | TEXT | nullable | |
| estado | VARCHAR(20) | DEFAULT 'PENDIENTE' | PENDIENTE → ENVIADA / FALLIDA / CANCELADA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `reglas_comision`
Fórmulas configurables por Gerencia.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| nombre | VARCHAR(100) | NOT NULL | Ej. "Comisión Desembolso Asesor" |
| rol_aplicable | VARCHAR(50) | nullable | NULL = aplica a todos |
| tipo_calculo | VARCHAR(20) | NOT NULL | FIJO / PORCENTAJE / MIXTO |
| monto_fijo | NUMERIC(10,2) | DEFAULT 0 | |
| porcentaje | NUMERIC(5,2) | DEFAULT 0 | |
| concepto | VARCHAR(50) | NOT NULL | DESEMBOLSO / RECUPERACION_MORA / EFECTIVIDAD_RUTA / META_MENSUAL |
| condiciones | JSONB | nullable | Reglas adicionales |
| estado | VARCHAR(20) | DEFAULT 'ACTIVA' | ACTIVA / INACTIVA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### `comisiones`
Registro individual con flujo de aprobación y bloqueo por pagaré.

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| usuario_id | UUID | FK → perfiles.id, NOT NULL | Genérico: asesor, cobrador, cualquier rol |
| regla_comision_id | UUID | FK → reglas_comision.id, NOT NULL | |
| prestamo_id | UUID | FK → prestamos.id, nullable | |
| entity_type | VARCHAR(50) | | 'prestamo', 'caso_morosidad', 'ruta_cobranza' |
| entity_id | UUID | | |
| monto_calculado | NUMERIC(10,2) | NOT NULL | Lo que el sistema determinó |
| monto_final | NUMERIC(10,2) | nullable | Lo que el supervisor aprobó/sobrescribió |
| motivo_override | TEXT | nullable | Obligatorio si monto_final ≠ monto_calculado |
| pagare_recibido | BOOLEAN | DEFAULT FALSE | Sincronizado con recepcion_pagares.recibido |
| aprobado_por | UUID | FK → perfiles.id, nullable | |
| fecha_aprobacion | TIMESTAMPTZ | nullable | |
| estado | VARCHAR(20) | DEFAULT 'CALCULADA' | CALCULADA → PENDIENTE_VALIDACION → APROBADA / RECHAZADA / BLOQUEADA_PAGARE → PAGADA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Audit:** Cambios de estado, overrides → audit_logs

### `audit_logs`
Rastro de auditoría inmutable (append-only).

| Columna | Tipo | Constraint | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| usuario_id | UUID | FK → perfiles.id, NOT NULL | Quién ejecutó la acción |
| fecha_hora | TIMESTAMPTZ | DEFAULT NOW() | Precisión de milisegundos |
| accion_realizada | VARCHAR(100) | NOT NULL | Ej. APROBACION_CREDITO, ANULACION_PAGO |
| tabla_afectada | VARCHAR(100) | NOT NULL | |
| registro_id | UUID | NOT NULL | ID de la fila modificada |
| valor_anterior | JSONB | nullable | Snapshot antes del cambio |
| valor_nuevo | JSONB | nullable | Snapshot después del cambio |
| ip_address | INET | nullable | |
| geolocalizacion_lat | NUMERIC(10,7) | nullable | |
| geolocalizacion_lon | NUMERIC(10,7) | nullable | |
| user_agent | TEXT | nullable | Dispositivo/browser |
| motivo | TEXT | nullable | Obligatorio para anulaciones |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Inmutabilidad:** Trigger PostgreSQL bloquea UPDATE y DELETE sobre esta tabla.

```sql
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es inmutable. No se permite UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

---

## Decision Log

> **Nota:** Las decisiones D13–D23 están implementadas en detalle en [`09_implementacion_tecnica_db.md`](./09_implementacion_tecnica_db.md).

| # | Decisión | Alternativas Consideradas | Justificación |
|---|---|---|---|
| 1 | Single-tenant | Multi-tenant por RLS, Multi-tenant por schema | Una sola empresa. No se necesita tenant_id en las tablas. |
| 2 | Cronograma triple (FIJO/FLEXIBLE/HIBRIDO) | Solo cuota fija, Solo flexible | El negocio requiere versatilidad. `es_sugerida` resuelve el híbrido sin romper el modelo. |
| 3 | RBAC + permisos granulares por usuario | RBAC puro, ABAC puro | Los roles cubren el 90% pero el negocio necesita excepciones individuales (grant/deny). |
| 4 | Zonas dinámicas con historial | Zona fija por usuario, Sin zonas | Los cobradores rotan. `asignaciones_zona` con fechas permite RLS dinámico e historial. |
| 5 | Zero-delete (solo estados) | Soft delete (deleted_at), Hard delete | Trazabilidad absoluta exigida por Gerencia. Auditoría de anulaciones obligatoria. |
| 6 | NUMERIC(10,2) exclusivo | FLOAT, MONEY, INTEGER (céntimos) | Precisión exacta para operaciones financieras. FLOAT introduce errores de redondeo. |
| 7 | Tabla dedicada por billete | JSON array en pago, Solo fotos | Permet cruce billete por billete, índice antifraude sobre numero_serie. |
| 8 | Cuaderno digital por préstamo | Por cliente, Redundante con pagos | Es bitácora narrativa complementaria a pagos. pago_id nullable permite notas sin transacción. |
| 9 | Activity Feed polimórfico | Chat simple 1:1, Solo canales Slack | El negocio requiere eventos automáticos del sistema + deep linking + canales + hilos contextuales. |
| 10 | Configuración en tabla key-value | Constantes en código, Config por zona | Gerencia necesita ajustar umbrales sin deploy. zona_id nullable prepara overrides Fase 2. |
| 11 | Doble trazabilidad de novación | Solo padre-hijo, Solo agrupación | prestamo_origen_id da la cadena. grupo_credito_id da reportería sin recursión. Ambos son necesarios. |
| 12 | Comisiones genéricas con flujo aprobación | Solo asesores, Comisión automática sin revisión | Se expandirá a cobradores. El override del supervisor es requisito de negocio. Bloqueo por pagaré es crítico. |
| 13 | FK: ON DELETE RESTRICT / ON UPDATE RESTRICT | CASCADE, NO ACTION | Máxima rigidez. Coherente con zero-delete. Bloquea DELETE/UPDATE accidental sobre UUIDs referenciados. |
| 14 | VARCHAR + CHECK constraints para estados | PostgreSQL ENUM types, Tablas catálogo | Flexibilidad para agregar estados sin ALTER TYPE. CHECK documenta valores válidos en catálogo PG. |
| 15 | RLS via helper functions SECURITY DEFINER | Custom Claims JWT, Híbrido | Cambios de permisos inmediatos (sin esperar refresh JWT). Crítico para bloqueos operativos en tiempo real. |
| 16 | Trigger genérico `set_updated_at()` | Extension moddatetime, Capa de aplicación | Control total sin extensiones. Consistencia garantizada incluso en queries SQL directos. |
| 17 | Todo en schema `public` | Schemas por capa, Híbrido public+internal | Supabase optimizado para public. PostgREST/Realtime sin fricción. Seguridad vía RLS, no ocultación. |
| 18 | 8 índices compuestos/parciales | Índices en todas las FK, Sin índices extra | Solo patrones de consulta identificados. Sin especulación. Expansión bajo demanda. |
| 19 | Híbrido: triggers PG + Edge Functions/pg_cron | Solo triggers, Solo Edge Functions | Triggers para atomicidad financiera. Edge Functions para batch y notificaciones externas. |
| 20 | Particionar solo `audit_logs` (mensual, pg_partman) | Particionar todo, No particionar | audit_logs es append-only e inmutable. Tablas con UPDATEs no particionan bien por fecha. Umbral 2M para resto. |
| 21 | Sync offline: accept-both + flag | Last-write-wins, Reject-on-conflict | Zero-delete: no se pierde evidencia de campo. Resolución por Administrativo, no por cobrador. |
| 22 | Realtime en 8 tablas críticas | Todas las tablas, Solo mensajes | Menor overhead. Expansión bajo demanda. Tablas: ruta_clientes, rutas_cobranza, solicitudes_prestamo, contratos, desembolsos, mensajes_chat, inconsistencias_pago, pagos. |
| 23 | Vistas SECURITY BARRIER para data masking | Enmascarar en frontend, Computed columns | Defense in depth real. Máscara imposible de esquivar desde la API para roles restringidos. 4 vistas: clientes, desembolsos, movimientos_bancarios, notificaciones. |

---

## Supuestos Confirmados

1. `cuadernos_cliente` es por **préstamo** (UNIQUE en prestamo_id).
2. Timestamps almacenados en **UTC**; zona horaria de Perú (UTC-5) en presentación.
3. Archivos en **Supabase Storage** organizados en buckets por tipo.
4. Notificaciones omnicanal registradas en tabla `notificaciones` para trazabilidad.
5. DNI peruano: siempre 8 caracteres exactos con CHECK constraint.
6. Transiciones de estado críticas generan registro en `audit_logs`.
7. Eventos operativos (pagos, visitas, cambios de estado) insertan mensajes automáticos en el Activity Feed.

---

## Inventario de Tablas (37 tablas)

| # | Capa | Tabla | Descripción |
|---|---|---|---|
| 1 | Fundación | `perfiles` | Usuarios del sistema |
| 2 | Fundación | `roles` | Catálogo de roles |
| 3 | Fundación | `permisos` | Catálogo de permisos atómicos |
| 4 | Fundación | `rol_permisos` | Permisos por rol (M:M) |
| 5 | Fundación | `usuario_roles` | Roles por usuario (M:M) |
| 6 | Fundación | `usuario_permisos` | Overrides individuales (grant/deny) |
| 7 | Fundación | `zonas` | Catálogo geográfico |
| 8 | Fundación | `asignaciones_zona` | Asignación dinámica cobrador↔zona |
| 9 | Fundación | `configuracion_sistema` | Parámetros editables (key-value) |
| 10 | Originación | `clientes` | Registro maestro de deudores |
| 11 | Originación | `solicitudes_prestamo` | Pipeline de evaluación |
| 12 | Originación | `documentos_solicitud` | Evidencia documental |
| 13 | Originación | `seeker_resultados` | Respuesta central de riesgo |
| 14 | Originación | `visitas_presenciales` | Verificaciones y visitas de campo |
| 15 | Originación | `evidencias` | Archivos georeferenciados |
| 16 | Originación | `referencias_entorno` | Formulario vecinal |
| 17 | Originación | `revisiones_supervisor` | Dictamen del comité |
| 18 | Formalización | `prestamos` | Entidad financiera central |
| 19 | Formalización | `cuotas_programadas` | Cronograma de pagos |
| 20 | Formalización | `contratos` | Documentos legales |
| 21 | Formalización | `recepcion_pagares` | Custodia de títulos valores |
| 22 | Formalización | `desembolsos` | Transferencias al cliente |
| 23 | Cobranza | `rutas_cobranza` | Plan diario del cobrador |
| 24 | Cobranza | `ruta_clientes` | Clientes en la ruta |
| 25 | Cobranza | `pagos` | Registro transaccional de cobros |
| 26 | Cobranza | `registro_billetes` | Trazabilidad individual de billetes |
| 27 | Cobranza | `vouchers` | Comprobantes digitales + OCR |
| 28 | Cobranza | `cuadernos_cliente` | Libreta digital por préstamo |
| 29 | Cobranza | `registros_cuaderno` | Bitácora cronológica |
| 30 | Consolidación | `movimientos_bancarios` | Transacciones bancarias importadas |
| 31 | Consolidación | `conciliaciones` | Batch de conciliación |
| 32 | Consolidación | `conciliacion_detalle` | Cruce pago↔banco |
| 33 | Consolidación | `inconsistencias_pago` | Discrepancias para gestión |
| 34 | Morosidad | `casos_morosidad` | Casos de atraso |
| 35 | Morosidad | `acciones_morosidad` | Bitácora de gestiones |
| 36 | Morosidad | `novaciones` | Refinanciamiento contable |
| 37 | Comunicación | `chats` | Canales e hilos |
| 38 | Comunicación | `chat_participantes` | Miembros |
| 39 | Comunicación | `mensajes_chat` | Mensajes + eventos sistema |
| 40 | Notificaciones | `notificaciones` | Comunicación omnicanal saliente |
| 41 | Comisiones | `reglas_comision` | Fórmulas configurables |
| 42 | Comisiones | `comisiones` | Registro con flujo aprobación |
| 43 | Auditoría | `audit_logs` | Rastro inmutable |

**Total: 43 tablas**
