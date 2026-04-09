-- ============================================================
-- MIGRACIÓN 12: Habilitación de RLS en todas las tablas
-- ============================================================
-- Nota: El particionamiento de audit_logs con pg_partman requiere
-- configuración adicional que depende del plan de Supabase.
-- Si pg_partman no está disponible, audit_logs funciona como
-- tabla estándar con el índice idx_audit_tabla_registro.
--
-- Para activar particionamiento cuando esté disponible:
-- 1. DROP TABLE audit_logs (con backup previo)
-- 2. Recrear como PARTITION BY RANGE (created_at)
-- 3. Configurar pg_partman con particiones mensuales

-- ============================================================
-- Habilitar RLS en TODAS las tablas
-- ============================================================

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rol_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_zona ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_prestamo ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_solicitud ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas_presenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE referencias_entorno ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones_supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas_programadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recepcion_pagares ENABLE ROW LEVEL SECURITY;
ALTER TABLE desembolsos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_cobranza ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruta_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_billetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadernos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_cuaderno ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE inconsistencias_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos_morosidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE acciones_morosidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE novaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_comision ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Políticas RLS Base (lectura por rol)
-- Nota: Estas son políticas iniciales. Se refinan por módulo.
-- ============================================================

-- Gerencia: acceso total de lectura a todas las tablas
-- (se aplica tabla por tabla, aquí las más críticas)

-- perfiles: todos los usuarios pueden ver sus propios datos
CREATE POLICY "usuarios_ven_su_perfil" ON perfiles
  FOR SELECT USING (id = auth.uid() OR has_role('GERENCIA') OR has_role('SUPERVISOR'));

CREATE POLICY "usuarios_editan_su_perfil" ON perfiles
  FOR UPDATE USING (id = auth.uid());

-- roles, permisos, rol_permisos: lectura para todos los autenticados
CREATE POLICY "roles_lectura" ON roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "permisos_lectura" ON permisos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "rol_permisos_lectura" ON rol_permisos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- usuario_roles: cada usuario ve sus propios roles, gerencia ve todos
CREATE POLICY "usuario_roles_lectura" ON usuario_roles
  FOR SELECT USING (usuario_id = auth.uid() OR has_role('GERENCIA'));

-- clientes: según rol
CREATE POLICY "clientes_select" ON clientes
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO') OR has_role('TESORERIA')
    OR registrado_por = auth.uid()
    OR zona_id = ANY(get_user_zona_ids())
  );

-- solicitudes_prestamo: asesor ve las suyas, supervisor/gerencia ve todas
CREATE POLICY "solicitudes_select" ON solicitudes_prestamo
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR asesor_id = auth.uid()
  );

-- prestamos: según rol y zona
CREATE POLICY "prestamos_select" ON prestamos
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('TESORERIA') OR has_role('ASESOR_ADMINISTRATIVO')
    OR asesor_id = auth.uid()
    OR zona_id = ANY(get_user_zona_ids())
  );

-- rutas_cobranza: cobrador ve sus rutas
CREATE POLICY "rutas_select" ON rutas_cobranza
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR cobrador_id = auth.uid()
  );

-- ruta_clientes: cobrador ve los clientes de sus rutas
CREATE POLICY "ruta_clientes_select" ON ruta_clientes
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR EXISTS (
      SELECT 1 FROM rutas_cobranza rc
      WHERE rc.id = ruta_clientes.ruta_id
      AND rc.cobrador_id = auth.uid()
    )
  );

-- pagos: según rol
CREATE POLICY "pagos_select" ON pagos
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('TESORERIA') OR has_role('ASESOR_ADMINISTRATIVO')
    OR cobrador_id = auth.uid()
  );

-- audit_logs: solo gerencia
CREATE POLICY "audit_solo_gerencia" ON audit_logs
  FOR SELECT USING (has_role('GERENCIA'));

-- mensajes_chat: participantes del chat
CREATE POLICY "mensajes_select" ON mensajes_chat
  FOR SELECT USING (
    has_role('GERENCIA')
    OR EXISTS (
      SELECT 1 FROM chat_participantes cp
      WHERE cp.chat_id = mensajes_chat.chat_id
      AND cp.usuario_id = auth.uid()
      AND cp.estado = 'ACTIVO'
    )
  );

-- chats: participantes del chat
CREATE POLICY "chats_select" ON chats
  FOR SELECT USING (
    has_role('GERENCIA')
    OR EXISTS (
      SELECT 1 FROM chat_participantes cp
      WHERE cp.chat_id = chats.id
      AND cp.usuario_id = auth.uid()
      AND cp.estado = 'ACTIVO'
    )
  );

-- configuracion_sistema: lectura para todos, escritura para gerencia
CREATE POLICY "config_lectura" ON configuracion_sistema
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "config_escritura" ON configuracion_sistema
  FOR ALL USING (has_role('GERENCIA'));

-- zonas: lectura para todos
CREATE POLICY "zonas_lectura" ON zonas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- casos_morosidad: según rol
CREATE POLICY "morosidad_select" ON casos_morosidad
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO')
    OR asignado_a = auth.uid()
  );

-- inconsistencias_pago: administrativos y superiores
CREATE POLICY "inconsistencias_select" ON inconsistencias_pago
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('ASESOR_ADMINISTRATIVO') OR has_role('TESORERIA')
  );

-- comisiones: usuario ve las suyas, gerencia/supervisor ve todas
CREATE POLICY "comisiones_select" ON comisiones
  FOR SELECT USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR usuario_id = auth.uid()
  );
