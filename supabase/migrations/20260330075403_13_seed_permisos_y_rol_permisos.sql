-- ============================================================
-- MIGRACIÓN 13: Seed de Permisos Atómicos y Mapeo Rol↔Permiso
-- Fuente: docs/02_estructura_permisos.md
-- ============================================================

-- ============================================================
-- 1. PERMISOS ATÓMICOS POR MÓDULO
-- ============================================================

-- MÓDULO: ORIGINACIÓN
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('CREAR_SOLICITUD', 'ORIGINACION', 'Crear nueva solicitud de préstamo con datos estructurados'),
  ('LEER_SOLICITUD_PROPIA', 'ORIGINACION', 'Ver estado de solicitudes propias (ingresadas por el usuario)'),
  ('LEER_SOLICITUD_TODAS', 'ORIGINACION', 'Ver todas las solicitudes del sistema'),
  ('CARGAR_DOCUMENTOS_SOLICITUD', 'ORIGINACION', 'Subir fotos DNI, recibos, documentos del solicitante'),
  ('LEER_VISITAS_ASIGNADAS', 'ORIGINACION', 'Ver visitas de verificación asignadas al usuario'),
  ('ESCRIBIR_CHECKIN_VISITA', 'ORIGINACION', 'Registrar check-in GPS en visita de verificación'),
  ('ESCRIBIR_REFERENCIAS_ENTORNO', 'ORIGINACION', 'Llenar formulario de referencias vecinales'),
  ('CARGAR_FOTOS_VERIFICACION', 'ORIGINACION', 'Subir fotos de fachada/negocio en verificación de campo'),
  ('LEER_TABLERO_DECISION', 'ORIGINACION', 'Ver tablero completo: Score + Fotos + Mapas + Referencias'),
  ('EJECUTAR_DICTAMEN', 'ORIGINACION', 'Aprobar/Rechazar/Observar una solicitud de crédito'),
  ('EDITAR_CONDICIONES_CREDITO', 'ORIGINACION', 'Ajustar monto, tasa o plazo aprobado');

-- MÓDULO: FORMALIZACIÓN
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('LEER_CONTRATOS', 'FORMALIZACION', 'Ver e imprimir contratos y pagarés generados'),
  ('CARGAR_EVIDENCIA_CONTRATO', 'FORMALIZACION', 'Subir foto de contrato/pagaré firmado'),
  ('LEER_COLA_DESEMBOLSO', 'FORMALIZACION', 'Ver préstamos aprobados pendientes de desembolso'),
  ('VALIDAR_DOCUMENTOS_LEGALES', 'FORMALIZACION', 'Check visual de calidad de foto de contrato'),
  ('RECHAZAR_DOCUMENTO', 'FORMALIZACION', 'Devolver documento al asesor para corrección'),
  ('EJECUTAR_DESEMBOLSO', 'FORMALIZACION', 'Registrar transferencia bancaria al cliente');

-- MÓDULO: COBRANZA
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('LEER_RUTA_DIA', 'COBRANZA', 'Ver lista de clientes en la ruta asignada del día'),
  ('LEER_CUADERNO_DIGITAL', 'COBRANZA', 'Ver saldo actual y últimas notas del préstamo'),
  ('ESCRIBIR_REGISTRO_COBRO', 'COBRANZA', 'Registrar cobro en efectivo con captura de billetes'),
  ('CARGAR_VOUCHER_DIGITAL', 'COBRANZA', 'Subir foto de comprobante Yape/Plin/Transferencia'),
  ('SOLICITAR_CIERRE_CUSTODIA', 'COBRANZA', 'Pedir autorización para no depositar efectivo'),
  ('APROBAR_CIERRE_CUSTODIA', 'COBRANZA', 'Autorizar cierre con efectivo en custodia'),
  ('CARGAR_CIERRE_RUTA', 'COBRANZA', 'Subir foto de voucher de depósito global'),
  ('LEER_RUTAS_TODAS', 'COBRANZA', 'Ver rutas de todos los cobradores'),
  ('VALIDAR_BILLETES', 'COBRANZA', 'Validar/rechazar billetes recibidos en Tesorería');

-- MÓDULO: CONSOLIDACIÓN
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('LEER_INCONSISTENCIAS', 'CONSOLIDACION', 'Ver alertas de pagos no conciliados'),
  ('EDITAR_RESOLUCION_PAGO', 'CONSOLIDACION', 'Corregir montos y validar vouchers manualmente'),
  ('LEER_MOVIMIENTOS_BANCARIOS', 'CONSOLIDACION', 'Ver transacciones bancarias importadas'),
  ('IMPORTAR_MOVIMIENTOS_BANCARIOS', 'CONSOLIDACION', 'Subir archivo de movimientos bancarios'),
  ('EJECUTAR_CONCILIACION', 'CONSOLIDACION', 'Disparar proceso de conciliación automática');

-- MÓDULO: MOROSIDAD
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('LEER_BANDEJA_MOROSIDAD', 'MOROSIDAD', 'Ver casos de morosidad priorizados'),
  ('ESCRIBIR_ACCIONES_GESTION', 'MOROSIDAD', 'Registrar llamadas, chats, promesas de pago'),
  ('LEER_HISTORIAL_CHATS', 'MOROSIDAD', 'Ver historial de negociación con clientes morosos'),
  ('ESCRIBIR_REFINANCIAMIENTO', 'MOROSIDAD', 'Ingresar condiciones de novación/reestructuración'),
  ('APROBAR_REFINANCIAMIENTO', 'MOROSIDAD', 'Aprobar novación propuesta');

-- MÓDULO: CUSTODIA
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('VALIDAR_RECEPCION_PAGARE', 'CUSTODIA', 'Marcar pagaré físico como recibido (libera comisiones)');

-- MÓDULO: COMUNICACIÓN
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('GESTIONAR_CHAT_INTERNO', 'COMUNICACION', 'Enviar mensajes, documentos e imágenes por chat interno'),
  ('CREAR_CANAL_CHAT', 'COMUNICACION', 'Crear canales de comunicación'),
  ('LEER_CHAT_ZONA', 'COMUNICACION', 'Ver mensajes del canal de zona asignada');

-- MÓDULO: COMISIONES
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('LEER_COMISIONES_PROPIAS', 'COMISIONES', 'Ver comisiones calculadas para el usuario'),
  ('LEER_COMISIONES_TODAS', 'COMISIONES', 'Ver comisiones de todos los usuarios'),
  ('APROBAR_COMISIONES', 'COMISIONES', 'Aprobar/rechazar/sobrescribir montos de comisiones'),
  ('CONFIGURAR_REGLAS_COMISION', 'COMISIONES', 'Crear/editar fórmulas de comisiones');

-- MÓDULO: CONFIGURACIÓN Y AUDITORÍA
INSERT INTO permisos (codigo, modulo, descripcion) VALUES
  ('LEER_AUDIT_LOGS', 'AUDITORIA', 'Ver rastro de auditoría inmutable'),
  ('GESTIONAR_USUARIOS', 'ADMINISTRACION', 'Crear usuarios, asignar roles y zonas'),
  ('GESTIONAR_ZONAS', 'ADMINISTRACION', 'Crear/editar zonas geográficas'),
  ('EDITAR_CONFIGURACION_SISTEMA', 'ADMINISTRACION', 'Modificar parámetros del sistema (key-value)'),
  ('LEER_DASHBOARD_GERENCIAL', 'ADMINISTRACION', 'Acceso al Dashboard global de métricas'),
  ('LEER_CLIENTES_ZONA', 'ORIGINACION', 'Ver clientes de las zonas asignadas al usuario'),
  ('LEER_CLIENTES_TODOS', 'ORIGINACION', 'Ver todos los clientes del sistema');

-- ============================================================
-- 2. MAPEO ROL ↔ PERMISO
-- Cada rol hereda los permisos documentados en 02_estructura_permisos.md
-- ============================================================

-- Helper: insertar mapeo rol↔permiso por nombre
CREATE OR REPLACE FUNCTION _seed_rol_permiso(p_rol TEXT, p_codigo TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT r.id, p.id
  FROM roles r, permisos p
  WHERE r.nombre = p_rol AND p.codigo = p_codigo
  ON CONFLICT ON CONSTRAINT uq_rol_permisos DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ASESOR_COMERCIAL
-- ============================================================
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'CREAR_SOLICITUD');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'LEER_SOLICITUD_PROPIA');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'CARGAR_DOCUMENTOS_SOLICITUD');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'LEER_CONTRATOS');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'CARGAR_EVIDENCIA_CONTRATO');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'GESTIONAR_CHAT_INTERNO');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'LEER_CHAT_ZONA');
SELECT _seed_rol_permiso('ASESOR_COMERCIAL', 'LEER_COMISIONES_PROPIAS');

-- ============================================================
-- COBRADOR_VERIFICADOR
-- ============================================================
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'LEER_VISITAS_ASIGNADAS');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'ESCRIBIR_CHECKIN_VISITA');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'ESCRIBIR_REFERENCIAS_ENTORNO');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'CARGAR_FOTOS_VERIFICACION');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'LEER_RUTA_DIA');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'LEER_CUADERNO_DIGITAL');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'ESCRIBIR_REGISTRO_COBRO');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'CARGAR_VOUCHER_DIGITAL');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'SOLICITAR_CIERRE_CUSTODIA');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'CARGAR_CIERRE_RUTA');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'GESTIONAR_CHAT_INTERNO');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'LEER_CHAT_ZONA');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'LEER_COMISIONES_PROPIAS');
SELECT _seed_rol_permiso('COBRADOR_VERIFICADOR', 'LEER_CLIENTES_ZONA');

-- ============================================================
-- SUPERVISOR
-- ============================================================
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_SOLICITUD_TODAS');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_TABLERO_DECISION');
SELECT _seed_rol_permiso('SUPERVISOR', 'EJECUTAR_DICTAMEN');
SELECT _seed_rol_permiso('SUPERVISOR', 'EDITAR_CONDICIONES_CREDITO');
SELECT _seed_rol_permiso('SUPERVISOR', 'APROBAR_CIERRE_CUSTODIA');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_RUTAS_TODAS');
SELECT _seed_rol_permiso('SUPERVISOR', 'ESCRIBIR_REFINANCIAMIENTO');
SELECT _seed_rol_permiso('SUPERVISOR', 'APROBAR_REFINANCIAMIENTO');
SELECT _seed_rol_permiso('SUPERVISOR', 'GESTIONAR_CHAT_INTERNO');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_CHAT_ZONA');
SELECT _seed_rol_permiso('SUPERVISOR', 'CREAR_CANAL_CHAT');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_COMISIONES_TODAS');
SELECT _seed_rol_permiso('SUPERVISOR', 'APROBAR_COMISIONES');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_CLIENTES_TODOS');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_BANDEJA_MOROSIDAD');
SELECT _seed_rol_permiso('SUPERVISOR', 'LEER_INCONSISTENCIAS');
SELECT _seed_rol_permiso('SUPERVISOR', 'IMPORTAR_MOVIMIENTOS_BANCARIOS');

-- ============================================================
-- TESORERIA
-- ============================================================
SELECT _seed_rol_permiso('TESORERIA', 'LEER_COLA_DESEMBOLSO');
SELECT _seed_rol_permiso('TESORERIA', 'VALIDAR_DOCUMENTOS_LEGALES');
SELECT _seed_rol_permiso('TESORERIA', 'RECHAZAR_DOCUMENTO');
SELECT _seed_rol_permiso('TESORERIA', 'EJECUTAR_DESEMBOLSO');
SELECT _seed_rol_permiso('TESORERIA', 'LEER_INCONSISTENCIAS');
SELECT _seed_rol_permiso('TESORERIA', 'LEER_MOVIMIENTOS_BANCARIOS');
SELECT _seed_rol_permiso('TESORERIA', 'VALIDAR_BILLETES');
SELECT _seed_rol_permiso('TESORERIA', 'GESTIONAR_CHAT_INTERNO');
SELECT _seed_rol_permiso('TESORERIA', 'LEER_CHAT_ZONA');
SELECT _seed_rol_permiso('TESORERIA', 'LEER_COMISIONES_PROPIAS');

-- ============================================================
-- ASESOR_ADMINISTRATIVO
-- ============================================================
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_INCONSISTENCIAS');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'EDITAR_RESOLUCION_PAGO');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_MOVIMIENTOS_BANCARIOS');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_BANDEJA_MOROSIDAD');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'ESCRIBIR_ACCIONES_GESTION');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_HISTORIAL_CHATS');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'VALIDAR_RECEPCION_PAGARE');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'GESTIONAR_CHAT_INTERNO');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_CHAT_ZONA');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'CREAR_CANAL_CHAT');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_COMISIONES_PROPIAS');
SELECT _seed_rol_permiso('ASESOR_ADMINISTRATIVO', 'LEER_CLIENTES_TODOS');

-- ============================================================
-- GERENCIA (acceso total)
-- ============================================================
-- Gerencia hereda TODOS los permisos del sistema
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'GERENCIA'
ON CONFLICT ON CONSTRAINT uq_rol_permisos DO NOTHING;

-- ============================================================
-- Limpieza: eliminar función helper temporal
-- ============================================================
DROP FUNCTION IF EXISTS _seed_rol_permiso(TEXT, TEXT);
