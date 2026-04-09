-- ============================================================
-- MIGRACIÓN 10: Vistas SECURITY BARRIER (Data Masking)
-- ============================================================

-- Vista enmascarada de clientes
CREATE OR REPLACE VIEW v_clientes_masked WITH (security_barrier = true) AS
SELECT
  id, dni, nombre_completo,
  CASE
    WHEN has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO')
    THEN telefono
    ELSE CONCAT('***-***-', RIGHT(COALESCE(telefono, ''), 4))
  END AS telefono,
  CASE
    WHEN has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO')
    THEN telefono_secundario
    ELSE CONCAT('***-***-', RIGHT(COALESCE(telefono_secundario, ''), 4))
  END AS telefono_secundario,
  email, direccion, referencia_direccion, zona_id,
  es_cliente_recurrente, calificacion_interna, foto_url,
  registrado_por, estado, created_at, updated_at
FROM clientes;

-- Vista enmascarada de desembolsos
CREATE OR REPLACE VIEW v_desembolsos_masked WITH (security_barrier = true) AS
SELECT
  id, prestamo_id, tesorero_id, monto, medio_desembolso,
  banco_destino,
  CASE
    WHEN has_role('GERENCIA') OR has_role('TESORERIA')
    THEN cuenta_destino
    ELSE CONCAT('****', RIGHT(COALESCE(cuenta_destino, ''), 4))
  END AS cuenta_destino,
  numero_operacion, url_comprobante, fecha_desembolso, estado, created_at
FROM desembolsos;

-- Vista enmascarada de movimientos bancarios
CREATE OR REPLACE VIEW v_movimientos_bancarios_masked WITH (security_barrier = true) AS
SELECT
  id, lote_importacion_id,
  CASE
    WHEN has_role('GERENCIA') OR has_role('TESORERIA')
    THEN cuenta_bancaria
    ELSE CONCAT('****', RIGHT(COALESCE(cuenta_bancaria, ''), 4))
  END AS cuenta_bancaria,
  banco, fecha_movimiento, monto, referencia,
  tipo_movimiento, origen, importado_por, estado, created_at
FROM movimientos_bancarios;

-- Vista enmascarada de notificaciones
CREATE OR REPLACE VIEW v_notificaciones_masked WITH (security_barrier = true) AS
SELECT
  id, tipo_destinatario, destinatario_cliente_id, destinatario_usuario_id,
  prestamo_id, caso_morosidad_id, tipo_notificacion, canal,
  CASE
    WHEN has_role('GERENCIA') OR has_role('ASESOR_ADMINISTRATIVO')
    THEN contenido
    ELSE '[Contenido restringido]'
  END AS contenido,
  fecha_programada, fecha_enviada, proveedor_id_externo,
  error_detalle, estado, created_at
FROM notificaciones;
