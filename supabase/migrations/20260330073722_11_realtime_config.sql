-- ============================================================
-- MIGRACIÓN 11: Configuración de Supabase Realtime
-- ============================================================

-- Habilitar Realtime solo en tablas críticas operativas
-- Nota: supabase_realtime es la publicación que Supabase usa
-- para streaming de cambios via WebSockets.

ALTER PUBLICATION supabase_realtime ADD TABLE ruta_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE rutas_cobranza;
ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes_prestamo;
ALTER PUBLICATION supabase_realtime ADD TABLE contratos;
ALTER PUBLICATION supabase_realtime ADD TABLE desembolsos;
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE inconsistencias_pago;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
