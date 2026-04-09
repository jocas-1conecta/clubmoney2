-- ============================================================
-- MIGRACIÓN 08: Índices Estratégicos
-- ============================================================

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

-- 9. Antifraude: billetes por número de serie
CREATE INDEX idx_billetes_serie
  ON registro_billetes(numero_serie);

-- 10. Búsqueda de clientes por DNI (ya cubierto por UNIQUE, pero útil para joins)
-- El UNIQUE constraint en clientes.dni ya crea un índice implícito.

-- 11. Casos de morosidad activos por préstamo
CREATE INDEX idx_morosidad_prestamo_estado
  ON casos_morosidad(prestamo_id, estado);

-- 12. Mensajes por chat (para paginación)
CREATE INDEX idx_mensajes_chat_fecha
  ON mensajes_chat(chat_id, created_at);
