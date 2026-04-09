# Implementación Técnica de Base de Datos — ClubMoney

> **Versión:** 2.0  
> **Fecha:** 2026-03-30  
> **Complementa:** `08_diseno_base_datos.md` (definición de tablas)  
> **Motor:** PostgreSQL 15+ (Supabase)  
> **Este documento:** Decisiones técnicas de implementación, SQL auxiliar, índices, triggers, vistas y configuración.

---

## Decisiones Técnicas (Decision Log Extendido)

| # | Decisión | Elección | Justificación |
|---|---|---|---|
| D1 | Comportamiento FK | `ON DELETE RESTRICT / ON UPDATE RESTRICT` | Máxima rigidez. Coherente con zero-delete. Bloquea cualquier DELETE/UPDATE accidental sobre UUIDs referenciados. |
| D2 | Columnas de estado | `VARCHAR + CHECK constraints` | Flexibilidad para agregar estados sin `ALTER TYPE`. CHECK documenta valores válidos en el catálogo de PG. |
| D3 | Estrategia RLS | Helper functions `SECURITY DEFINER` | Cambios de permisos inmediatos (sin esperar refresh de JWT). Crítico para bloqueos operativos en tiempo real. |
| D4 | `updated_at` automático | Trigger genérico `set_updated_at()` | Control total sin depender de extensiones. Garantiza consistencia incluso en queries SQL directos. |
| D5 | Organización schemas | Todo en `public` | Supabase optimizado para `public`. PostgREST, Realtime y RLS funcionan sin fricción. Seguridad vía RLS, no ocultación. |
| D6 | Índices | 8 compuestos/parciales para patrones críticos | Solo patrones de consulta identificados. Sin índices especulativos. Expansión bajo demanda. |
| D7 | Lógica de negocio | Híbrido: triggers PG (transaccional) + Edge Functions/pg_cron (batch) | Triggers para atomicidad financiera. Edge Functions para procesos programados y notificaciones externas. |
| D8 | Particionamiento | `audit_logs` mensual desde inicio (pg_partman). Resto sin particiones (umbral: 2M filas) | audit_logs es append-only e inmutable. Tablas transaccionales con UPDATEs no particionan bien por fecha. |
| D9 | Conflictos sync offline | Accept-both + flag `PAGO_DUPLICADO_SYNC` en `inconsistencias_pago` | Zero-delete: no se pierde evidencia de campo. Resolución por Asesor Administrativo, no por cobrador. |
| D10 | Supabase Realtime | 8 tablas críticas habilitadas | Menor overhead. Expansión bajo demanda. |
| D11 | Data masking | Vistas `SECURITY BARRIER` para 4 tablas sensibles | Defense in depth. Máscara imposible de esquivar desde la API para roles restringidos. |

---

## 1. Funciones Auxiliares

### 1.1 Trigger `set_updated_at()`

Aplicar a TODAS las tablas que tienen columna `updated_at`.

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Tablas que requieren este trigger** (23 tablas):
`perfiles`, `zonas`, `configuracion_sistema`, `clientes`, `solicitudes_prestamo`, 
`visitas_presenciales`, `contratos`, `recepcion_pagares`, `prestamos`, 
`cuotas_programadas`, `rutas_cobranza`, `ruta_clientes`, `pagos`, 
`registro_billetes`, `cuadernos_cliente`, `conciliaciones`, 
`inconsistencias_pago`, `casos_morosidad`, `novaciones`, `chats`, 
`chat_participantes`, `comisiones`, `reglas_comision`.

Ejemplo de binding:
```sql
CREATE TRIGGER trg_updated_at_perfiles
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- Repetir para cada tabla listada
```

### 1.2 Protección de inmutabilidad `audit_logs`

```sql
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es inmutable. No se permite UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

### 1.3 Helper functions para RLS

```sql
-- Obtener roles del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(r.nombre)
  FROM usuario_roles ur
  JOIN roles r ON r.id = ur.rol_id
  WHERE ur.usuario_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si el usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON r.id = ur.rol_id
    WHERE ur.usuario_id = auth.uid()
    AND r.nombre = role_name
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Obtener IDs de zonas activas del usuario
CREATE OR REPLACE FUNCTION public.get_user_zona_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(az.zona_id)
  FROM asignaciones_zona az
  WHERE az.usuario_id = auth.uid()
  AND az.activo = TRUE
  AND (az.fecha_fin IS NULL OR az.fecha_fin >= CURRENT_DATE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verificar si el usuario tiene un permiso específico (RBAC + overrides)
CREATE OR REPLACE FUNCTION public.has_permission(permission_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_deny BOOLEAN;
  has_grant BOOLEAN;
  has_role_perm BOOLEAN;
BEGIN
  -- 1. Verificar DENY individual (máxima prioridad)
  SELECT EXISTS (
    SELECT 1 FROM usuario_permisos up
    JOIN permisos p ON p.id = up.permiso_id
    WHERE up.usuario_id = auth.uid()
    AND p.codigo = permission_code
    AND up.tipo = 'DENY'
  ) INTO has_deny;
  IF has_deny THEN RETURN FALSE; END IF;

  -- 2. Verificar GRANT individual
  SELECT EXISTS (
    SELECT 1 FROM usuario_permisos up
    JOIN permisos p ON p.id = up.permiso_id
    WHERE up.usuario_id = auth.uid()
    AND p.codigo = permission_code
    AND up.tipo = 'GRANT'
  ) INTO has_grant;
  IF has_grant THEN RETURN TRUE; END IF;

  -- 3. Verificar permisos heredados por roles
  SELECT EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN rol_permisos rp ON rp.rol_id = ur.rol_id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE ur.usuario_id = auth.uid()
    AND p.codigo = permission_code
  ) INTO has_role_perm;
  RETURN has_role_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## 2. CHECK Constraints por Tabla

### CAPA 1 — Fundación
```sql
-- perfiles
ALTER TABLE perfiles ADD CONSTRAINT chk_perfiles_estado
  CHECK (estado IN ('ACTIVO','INACTIVO','SUSPENDIDO'));

-- roles
ALTER TABLE roles ADD CONSTRAINT chk_roles_nombre
  CHECK (nombre IN ('ASESOR_COMERCIAL','COBRADOR_VERIFICADOR','SUPERVISOR','TESORERIA','ASESOR_ADMINISTRATIVO','GERENCIA'));
ALTER TABLE roles ADD CONSTRAINT chk_roles_estado
  CHECK (estado IN ('ACTIVO','INACTIVO'));

-- usuario_permisos
ALTER TABLE usuario_permisos ADD CONSTRAINT chk_usuario_permisos_tipo
  CHECK (tipo IN ('GRANT','DENY'));

-- zonas
ALTER TABLE zonas ADD CONSTRAINT chk_zonas_estado
  CHECK (estado IN ('ACTIVA','INACTIVA'));

-- configuracion_sistema
ALTER TABLE configuracion_sistema ADD CONSTRAINT chk_config_tipo_dato
  CHECK (tipo_dato IN ('NUMBER','STRING','BOOLEAN','JSON'));
```

### CAPA 2 — Clientes y Originación
```sql
-- clientes
ALTER TABLE clientes ADD CONSTRAINT chk_clientes_estado
  CHECK (estado IN ('ACTIVO','INACTIVO','BLOQUEADO'));
ALTER TABLE clientes ADD CONSTRAINT chk_clientes_calificacion
  CHECK (calificacion_interna IN ('EXCELENTE','BUENO','REGULAR','MALO'));

-- solicitudes_prestamo
ALTER TABLE solicitudes_prestamo ADD CONSTRAINT chk_solicitud_estado
  CHECK (estado IN ('INGRESADA','EN_EVALUACION','VERIFICACION_CAMPO','APROBADA','RECHAZADA','OBSERVADA','EN_FORMALIZACION'));
ALTER TABLE solicitudes_prestamo ADD CONSTRAINT chk_solicitud_cronograma
  CHECK (tipo_cronograma IN ('FIJO','FLEXIBLE','HIBRIDO'));

-- documentos_solicitud
ALTER TABLE documentos_solicitud ADD CONSTRAINT chk_doc_tipo
  CHECK (tipo_documento IN ('DNI_FRONTAL','DNI_REVERSO','RECIBO_LUZ','CONTRATO_ALQUILER','SELFIE','PRUEBA_VIDA'));
ALTER TABLE documentos_solicitud ADD CONSTRAINT chk_doc_validacion
  CHECK (estado_validacion IN ('RECIBIDO','VALIDADO','RECHAZADO','BORROSO'));

-- seeker_resultados
ALTER TABLE seeker_resultados ADD CONSTRAINT chk_seeker_estado
  CHECK (estado IN ('PROCESADO','ERROR','PENDIENTE'));

-- visitas_presenciales
ALTER TABLE visitas_presenciales ADD CONSTRAINT chk_visita_tipo
  CHECK (tipo_visita IN ('VERIFICACION','COBRANZA','RECUPERACION'));
ALTER TABLE visitas_presenciales ADD CONSTRAINT chk_visita_estado
  CHECK (estado_visita IN ('PROGRAMADA','EN_CURSO','COMPLETADA','AUSENTE','SIN_DINERO','REPROGRAMADA'));

-- evidencias
ALTER TABLE evidencias ADD CONSTRAINT chk_evidencia_tipo
  CHECK (tipo_evidencia IN ('FOTO_FACHADA','FOTO_NEGOCIO','FOTO_DNI','GEOLOCALIZACION','VIDEO'));

-- revisiones_supervisor
ALTER TABLE revisiones_supervisor ADD CONSTRAINT chk_revision_dictamen
  CHECK (dictamen IN ('APROBADO','RECHAZADO','OBSERVADO'));
```

### CAPA 3 — Formalización y Préstamos
```sql
-- prestamos
ALTER TABLE prestamos ADD CONSTRAINT chk_prestamo_estado
  CHECK (estado IN ('PENDIENTE_DESEMBOLSO','ACTIVO','CANCELADO','CANCELADO_POR_REFINANCIACION','VENCIDO','EN_MORA'));
ALTER TABLE prestamos ADD CONSTRAINT chk_prestamo_cronograma
  CHECK (tipo_cronograma IN ('FIJO','FLEXIBLE','HIBRIDO'));

-- cuotas_programadas
ALTER TABLE cuotas_programadas ADD CONSTRAINT chk_cuota_estado
  CHECK (estado IN ('PENDIENTE','PARCIAL','PAGADA','VENCIDA'));

-- contratos
ALTER TABLE contratos ADD CONSTRAINT chk_contrato_tipo
  CHECK (tipo_contrato IN ('CONTRATO_PRESTAMO','PAGARE'));
ALTER TABLE contratos ADD CONSTRAINT chk_contrato_estado
  CHECK (estado IN ('GENERADO','SUBIDO','VALIDADO','DEVUELTO'));

-- recepcion_pagares
ALTER TABLE recepcion_pagares ADD CONSTRAINT chk_pagare_estado
  CHECK (estado IN ('PENDIENTE','RECIBIDO','EXTRAVIADO'));

-- desembolsos
ALTER TABLE desembolsos ADD CONSTRAINT chk_desembolso_medio
  CHECK (medio_desembolso IN ('TRANSFERENCIA_BANCARIA','EFECTIVO'));
ALTER TABLE desembolsos ADD CONSTRAINT chk_desembolso_estado
  CHECK (estado IN ('EJECUTADO','ANULADO'));
```

### CAPA 4 — Cobranza
```sql
-- rutas_cobranza
ALTER TABLE rutas_cobranza ADD CONSTRAINT chk_ruta_estado
  CHECK (estado IN ('PLANIFICADA','EN_CURSO','CERRADA','CIERRE_CON_CUSTODIA'));

-- ruta_clientes
ALTER TABLE ruta_clientes ADD CONSTRAINT chk_ruta_cli_prioridad
  CHECK (prioridad IN ('NORMAL','ALTA','URGENTE'));
ALTER TABLE ruta_clientes ADD CONSTRAINT chk_ruta_cli_estado
  CHECK (estado_visita IN ('PENDIENTE','VISITADO','AUSENTE','SIN_DINERO','COBRADO','PAGO_PARCIAL'));

-- pagos
ALTER TABLE pagos ADD CONSTRAINT chk_pago_medio
  CHECK (medio_pago IN ('EFECTIVO','YAPE','PLIN','TRANSFERENCIA_BANCARIA'));
ALTER TABLE pagos ADD CONSTRAINT chk_pago_estado
  CHECK (estado IN ('REGISTRADO','RECAUDADO_EN_CAMPO','PENDIENTE_CONCILIACION','CONCILIADO','ANULADO','EXTORNADO'));

-- registro_billetes
ALTER TABLE registro_billetes ADD CONSTRAINT chk_billete_estado
  CHECK (estado IN ('REGISTRADO_CAMPO','VALIDADO_TESORERIA','RECHAZADO','SOSPECHOSO'));

-- cuadernos_cliente
ALTER TABLE cuadernos_cliente ADD CONSTRAINT chk_cuaderno_estado
  CHECK (estado IN ('ACTIVO','CERRADO'));

-- registros_cuaderno
ALTER TABLE registros_cuaderno ADD CONSTRAINT chk_reg_cuaderno_tipo
  CHECK (tipo_registro IN ('PAGO','NOTA_CAMPO','VISITA_FALLIDA','AJUSTE','NOTIFICACION_ENVIADA'));
```

### CAPA 5 — Consolidación
```sql
-- movimientos_bancarios
ALTER TABLE movimientos_bancarios ADD CONSTRAINT chk_mov_tipo
  CHECK (tipo_movimiento IN ('ABONO','CARGO'));
ALTER TABLE movimientos_bancarios ADD CONSTRAINT chk_mov_origen
  CHECK (origen IN ('IMPORTACION_ARCHIVO','MANUAL'));
ALTER TABLE movimientos_bancarios ADD CONSTRAINT chk_mov_estado
  CHECK (estado IN ('PENDIENTE','CONCILIADO','SIN_COINCIDENCIA'));

-- conciliaciones
ALTER TABLE conciliaciones ADD CONSTRAINT chk_conc_tipo
  CHECK (tipo IN ('AUTOMATICA','MANUAL'));
ALTER TABLE conciliaciones ADD CONSTRAINT chk_conc_estado
  CHECK (estado IN ('EN_PROCESO','FINALIZADA','CERRADA'));

-- inconsistencias_pago
ALTER TABLE inconsistencias_pago ADD CONSTRAINT chk_incons_tipo
  CHECK (tipo_inconsistencia IN ('MONTO_DIFIERE','VOUCHER_ILEGIBLE','DEPOSITO_NO_FIGURA','PAGO_SIN_MOVIMIENTO','MOVIMIENTO_SIN_PAGO','BILLETE_RECHAZADO','PAGO_DUPLICADO_SYNC'));
ALTER TABLE inconsistencias_pago ADD CONSTRAINT chk_incons_estado
  CHECK (estado IN ('ABIERTA','EN_REVISION','RESUELTA'));
```

### CAPA 6 — Morosidad
```sql
-- casos_morosidad
ALTER TABLE casos_morosidad ADD CONSTRAINT chk_mora_categoria
  CHECK (categoria_mora IN ('MORA_TEMPRANA','MORA_MEDIA','MORA_GRAVE','PREJURIDICO'));
ALTER TABLE casos_morosidad ADD CONSTRAINT chk_mora_estado
  CHECK (estado IN ('ABIERTO','EN_GESTION','RECUPERADO','REFINANCIADO','ESCALADO_CAMPO','CASTIGO'));

-- acciones_morosidad
ALTER TABLE acciones_morosidad ADD CONSTRAINT chk_accion_tipo
  CHECK (tipo_accion IN ('LLAMADA','WHATSAPP','SMS','EMAIL','VISITA_CAMPO','NOTIFICACION_EMBARGO','PROMESA_PAGO','ACUERDO_PAGO'));

-- novaciones
ALTER TABLE novaciones ADD CONSTRAINT chk_novacion_estado
  CHECK (estado IN ('PROPUESTA','APROBADA','EJECUTADA','ANULADA'));
```

### CAPA 7 — Comunicación, Notificaciones, Comisiones
```sql
-- chats
ALTER TABLE chats ADD CONSTRAINT chk_chat_tipo
  CHECK (tipo_chat IN ('CANAL_GENERAL','CANAL_ZONA','HILO_CLIENTE','HILO_MOROSIDAD','HILO_PRESTAMO','DIRECTO'));
ALTER TABLE chats ADD CONSTRAINT chk_chat_estado
  CHECK (estado IN ('ACTIVO','ARCHIVADO'));

-- chat_participantes
ALTER TABLE chat_participantes ADD CONSTRAINT chk_chat_part_rol
  CHECK (rol_en_chat IN ('MIEMBRO','ADMIN'));
ALTER TABLE chat_participantes ADD CONSTRAINT chk_chat_part_estado
  CHECK (estado IN ('ACTIVO','SILENCIADO','REMOVIDO'));

-- mensajes_chat
ALTER TABLE mensajes_chat ADD CONSTRAINT chk_msg_tipo
  CHECK (tipo_mensaje IN ('TEXTO','IMAGEN','DOCUMENTO','EVENTO_SISTEMA'));
ALTER TABLE mensajes_chat ADD CONSTRAINT chk_msg_estado
  CHECK (estado IN ('ENVIADO','ANULADO'));

-- notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT chk_notif_dest_tipo
  CHECK (tipo_destinatario IN ('CLIENTE','EMPLEADO'));
ALTER TABLE notificaciones ADD CONSTRAINT chk_notif_canal
  CHECK (canal IN ('WHATSAPP','SMS','EMAIL'));
ALTER TABLE notificaciones ADD CONSTRAINT chk_notif_estado
  CHECK (estado IN ('PENDIENTE','ENVIADA','FALLIDA','CANCELADA'));

-- reglas_comision
ALTER TABLE reglas_comision ADD CONSTRAINT chk_regla_tipo_calc
  CHECK (tipo_calculo IN ('FIJO','PORCENTAJE','MIXTO'));
ALTER TABLE reglas_comision ADD CONSTRAINT chk_regla_concepto
  CHECK (concepto IN ('DESEMBOLSO','RECUPERACION_MORA','EFECTIVIDAD_RUTA','META_MENSUAL'));
ALTER TABLE reglas_comision ADD CONSTRAINT chk_regla_estado
  CHECK (estado IN ('ACTIVA','INACTIVA'));

-- comisiones
ALTER TABLE comisiones ADD CONSTRAINT chk_comision_estado
  CHECK (estado IN ('CALCULADA','PENDIENTE_VALIDACION','APROBADA','RECHAZADA','BLOQUEADA_PAGARE','PAGADA'));
```

---

## 3. Índices Estratégicos

```sql
-- 1. Rutas del día por cobrador
CREATE INDEX idx_rutas_cobrador_fecha
  ON rutas_cobranza(cobrador_id, fecha_ruta);

-- 2. Pagos por préstamo (ordenados cronológicamente)
CREATE INDEX idx_pagos_prestamo_fecha
  ON pagos(prestamo_id, fecha_pago);

-- 3. Cuotas pendientes por préstamo
CREATE INDEX idx_cuotas_prestamo_estado
  ON cuotas_programadas(prestamo_id, estado);

-- 4. Clientes activos por zona
CREATE INDEX idx_clientes_zona_estado
  ON clientes(zona_id, estado);

-- 5. Movimientos bancarios pendientes por referencia
CREATE INDEX idx_mov_banco_ref_estado
  ON movimientos_bancarios(referencia, estado);

-- 6. Préstamos activos por vencimiento (batch de mora)
CREATE INDEX idx_prestamos_estado_vencimiento
  ON prestamos(estado, fecha_vencimiento);

-- 7. Pagos pendientes de sync (parcial — solo TRUE)
CREATE INDEX idx_pagos_sync_pending
  ON pagos(sync_pending) WHERE sync_pending = TRUE;

-- 8. Audit trail por tabla y registro
CREATE INDEX idx_audit_tabla_registro
  ON audit_logs(tabla_afectada, registro_id);

-- 9. Antifraude: billetes por número de serie (ya definido)
CREATE INDEX idx_billetes_serie
  ON registro_billetes(numero_serie);
```

---

## 4. Particionamiento de `audit_logs`

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- Crear tabla particionada
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_hora TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accion_realizada VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  valor_anterior JSONB,
  valor_nuevo JSONB,
  ip_address INET,
  geolocalizacion_lat NUMERIC(10,7),
  geolocalizacion_lon NUMERIC(10,7),
  user_agent TEXT,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Configurar pg_partman para particiones mensuales
SELECT partman.create_parent(
  p_parent_table := 'public.audit_logs',
  p_control := 'created_at',
  p_type := 'native',
  p_interval := '1 month',
  p_premake := 3
);

-- Mantenimiento automático (ejecutar via pg_cron diariamente)
-- SELECT partman.run_maintenance();
```

---

## 5. Vistas SECURITY BARRIER (Data Masking)

```sql
-- Vista enmascarada de clientes
CREATE VIEW v_clientes_masked WITH (security_barrier = true) AS
SELECT
  id, dni, nombre_completo,
  CASE WHEN has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO')
    THEN telefono
    ELSE CONCAT('***-***-', RIGHT(telefono, 4))
  END AS telefono,
  CASE WHEN has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO')
    THEN telefono_secundario
    ELSE CONCAT('***-***-', RIGHT(telefono_secundario, 4))
  END AS telefono_secundario,
  email, direccion, referencia_direccion, zona_id,
  es_cliente_recurrente, calificacion_interna, foto_url,
  registrado_por, estado, created_at, updated_at
FROM clientes;

-- Vista enmascarada de desembolsos
CREATE VIEW v_desembolsos_masked WITH (security_barrier = true) AS
SELECT
  id, prestamo_id, tesorero_id, monto, medio_desembolso,
  banco_destino,
  CASE WHEN has_role('GERENCIA') OR has_role('TESORERIA')
    THEN cuenta_destino
    ELSE CONCAT('****', RIGHT(cuenta_destino, 4))
  END AS cuenta_destino,
  numero_operacion, url_comprobante, fecha_desembolso, estado, created_at
FROM desembolsos;

-- Vista enmascarada de movimientos bancarios
CREATE VIEW v_movimientos_bancarios_masked WITH (security_barrier = true) AS
SELECT
  id, lote_importacion_id,
  CASE WHEN has_role('GERENCIA') OR has_role('TESORERIA')
    THEN cuenta_bancaria
    ELSE CONCAT('****', RIGHT(cuenta_bancaria, 4))
  END AS cuenta_bancaria,
  banco, fecha_movimiento, monto, referencia,
  tipo_movimiento, origen, importado_por, estado, created_at
FROM movimientos_bancarios;

-- Vista enmascarada de notificaciones
CREATE VIEW v_notificaciones_masked WITH (security_barrier = true) AS
SELECT
  id, tipo_destinatario, destinatario_cliente_id, destinatario_usuario_id,
  prestamo_id, caso_morosidad_id, tipo_notificacion, canal,
  CASE WHEN has_role('GERENCIA') OR has_role('ASESOR_ADMINISTRATIVO')
    THEN contenido
    ELSE '[Contenido restringido]'
  END AS contenido,
  fecha_programada, fecha_enviada, proveedor_id_externo,
  error_detalle, estado, created_at
FROM notificaciones;
```

---

## 6. Supabase Realtime — Tablas Habilitadas

```sql
-- Habilitar Realtime solo en tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE ruta_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE rutas_cobranza;
ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes_prestamo;
ALTER PUBLICATION supabase_realtime ADD TABLE contratos;
ALTER PUBLICATION supabase_realtime ADD TABLE desembolsos;
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE inconsistencias_pago;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
```

---

## 7. Triggers de Negocio (Transaccionales)

### 7.1 Alerta de billete duplicado
```sql
CREATE OR REPLACE FUNCTION check_billete_duplicado()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM registro_billetes
    WHERE numero_serie = NEW.numero_serie
    AND id != NEW.id
  ) THEN
    -- Marcar como sospechoso
    NEW.estado := 'SOSPECHOSO';
    -- Insertar alerta en audit_logs
    INSERT INTO audit_logs (usuario_id, accion_realizada, tabla_afectada, registro_id, valor_nuevo, motivo)
    VALUES (NEW.registrado_por, 'ALERTA_BILLETE_DUPLICADO', 'registro_billetes', NEW.id,
      jsonb_build_object('numero_serie', NEW.numero_serie, 'pago_id', NEW.pago_id),
      'Número de serie ya registrado en el sistema');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_billete_duplicado
  BEFORE INSERT ON registro_billetes
  FOR EACH ROW EXECUTE FUNCTION check_billete_duplicado();
```

### 7.2 Actualización de saldo al conciliar pago
```sql
CREATE OR REPLACE FUNCTION update_saldo_on_conciliacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'CONCILIADO' AND OLD.estado != 'CONCILIADO' THEN
    UPDATE prestamos
    SET saldo_pendiente = saldo_pendiente - NEW.monto,
        updated_at = NOW()
    WHERE id = NEW.prestamo_id;

    UPDATE cuadernos_cliente
    SET saldo_actual = saldo_actual - NEW.monto,
        total_pagado = total_pagado + NEW.monto,
        ultimo_pago_fecha = NEW.fecha_pago,
        updated_at = NOW()
    WHERE prestamo_id = NEW.prestamo_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_saldo_conciliacion
  AFTER UPDATE OF estado ON pagos
  FOR EACH ROW
  WHEN (NEW.estado = 'CONCILIADO')
  EXECUTE FUNCTION update_saldo_on_conciliacion();
```

### 7.3 Bloqueo de comisión por pagaré no recibido
```sql
CREATE OR REPLACE FUNCTION sync_comision_pagare()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recibido = TRUE AND OLD.recibido = FALSE THEN
    UPDATE comisiones
    SET pagare_recibido = TRUE,
        estado = CASE WHEN estado = 'BLOQUEADA_PAGARE' THEN 'PENDIENTE_VALIDACION' ELSE estado END,
        updated_at = NOW()
    WHERE prestamo_id = NEW.prestamo_id
    AND pagare_recibido = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_comision_pagare
  AFTER UPDATE OF recibido ON recepcion_pagares
  FOR EACH ROW
  WHEN (NEW.recibido = TRUE)
  EXECUTE FUNCTION sync_comision_pagare();
```

---

## 8. Jobs Batch (Edge Functions / pg_cron)

| Job | Horario | Implementación | Descripción |
|---|---|---|---|
| Detección de mora | 6:00 AM diario | pg_cron → función PL/pgSQL | Escanea préstamos activos, crea/actualiza `casos_morosidad` |
| Conciliación automática | 8:00 AM diario | Edge Function | Cruza `pagos` vs `movimientos_bancarios` |
| Alerta promesa incumplida | 7:00 AM diario | pg_cron | Si `fecha_promesa_pago` venció sin pago → alerta |
| Generación de rutas | 7:00 AM diario | Edge Function | Crea `rutas_cobranza` y `ruta_clientes` del día |
| Notificaciones omnicanal | Continuo (event-driven) | Edge Function | Disparado por INSERTs en `notificaciones` |
| Mantenimiento particiones | 1:00 AM diario | pg_cron | `SELECT partman.run_maintenance()` |

---

## 9. Manejo de Conflictos Offline (Sync)

### Flujo de sincronización

1. **App registra pago offline** → Guarda en SQLite local con `sync_pending = TRUE` y `fecha_pago` = timestamp del dispositivo.
2. **App recupera conexión** → Envía cola de pagos pendientes a Supabase.
3. **Servidor recibe pago** → INSERT en `pagos` con `fecha_registro = NOW()` (hora servidor) y `fecha_pago` = hora original del dispositivo.
4. **Detección de conflicto** → Trigger verifica si ya existe pago para la misma `cuota_id`:

```sql
CREATE OR REPLACE FUNCTION detect_sync_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cuota_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM pagos
    WHERE cuota_id = NEW.cuota_id
    AND id != NEW.id
    AND estado NOT IN ('ANULADO', 'EXTORNADO')
  ) THEN
    INSERT INTO inconsistencias_pago (
      conciliacion_id, pago_id, tipo_inconsistencia, descripcion, estado
    ) VALUES (
      NULL, NEW.id, 'PAGO_DUPLICADO_SYNC',
      'Pago registrado offline coincide con pago existente para la misma cuota',
      'ABIERTA'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detect_sync_conflict
  AFTER INSERT ON pagos
  FOR EACH ROW
  WHEN (NEW.sync_pending = TRUE)
  EXECUTE FUNCTION detect_sync_conflict();
```

---

## 10. Ejemplo de Política RLS

```sql
-- Ejemplo: Asesor Comercial solo ve sus propios clientes
CREATE POLICY "asesor_ve_sus_clientes" ON clientes
  FOR SELECT
  USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO')
    OR registrado_por = auth.uid()
  );

-- Ejemplo: Cobrador solo ve clientes de sus zonas activas
CREATE POLICY "cobrador_ve_zona" ON ruta_clientes
  FOR SELECT
  USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR EXISTS (
      SELECT 1 FROM rutas_cobranza rc
      WHERE rc.id = ruta_clientes.ruta_id
      AND rc.cobrador_id = auth.uid()
    )
  );

-- Ejemplo: audit_logs — solo lectura para Gerencia
CREATE POLICY "audit_solo_gerencia" ON audit_logs
  FOR SELECT
  USING (has_role('GERENCIA'));
-- No se crean políticas INSERT/UPDATE/DELETE para roles humanos.
-- Los INSERTs se hacen via SECURITY DEFINER functions.
```
