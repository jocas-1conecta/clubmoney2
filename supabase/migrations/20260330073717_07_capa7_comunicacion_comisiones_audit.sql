-- ============================================================
-- MIGRACIÓN 07: CAPA 7 — Comunicación, Notificaciones,
--                         Comisiones y Auditoría
-- ============================================================

-- chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_chat VARCHAR(30) NOT NULL,
  nombre VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  zona_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  creado_por UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_chat_tipo CHECK (tipo_chat IN ('CANAL_GENERAL','CANAL_ZONA','HILO_CLIENTE','HILO_MOROSIDAD','HILO_PRESTAMO','DIRECTO')),
  CONSTRAINT chk_chat_estado CHECK (estado IN ('ACTIVO','ARCHIVADO'))
);

CREATE TRIGGER trg_updated_at_chats
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- chat_participantes
CREATE TABLE chat_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  rol_en_chat VARCHAR(20) NOT NULL DEFAULT 'MIEMBRO',
  ultima_lectura TIMESTAMPTZ,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_chat_participante UNIQUE (chat_id, usuario_id),
  CONSTRAINT chk_chat_part_rol CHECK (rol_en_chat IN ('MIEMBRO','ADMIN')),
  CONSTRAINT chk_chat_part_estado CHECK (estado IN ('ACTIVO','SILENCIADO','REMOVIDO'))
);

CREATE TRIGGER trg_updated_at_chat_part
  BEFORE UPDATE ON chat_participantes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- mensajes_chat
CREATE TABLE mensajes_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  autor_id UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_mensaje VARCHAR(30) NOT NULL,
  contenido TEXT,
  url_archivo TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  estado VARCHAR(20) NOT NULL DEFAULT 'ENVIADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_msg_tipo CHECK (tipo_mensaje IN ('TEXTO','IMAGEN','DOCUMENTO','EVENTO_SISTEMA')),
  CONSTRAINT chk_msg_estado CHECK (estado IN ('ENVIADO','ANULADO'))
);

-- notificaciones
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_destinatario VARCHAR(20) NOT NULL,
  destinatario_cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  destinatario_usuario_id UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  prestamo_id UUID REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  caso_morosidad_id UUID REFERENCES casos_morosidad(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_notificacion VARCHAR(50) NOT NULL,
  canal VARCHAR(20) NOT NULL,
  contenido TEXT,
  fecha_programada TIMESTAMPTZ,
  fecha_enviada TIMESTAMPTZ,
  proveedor_id_externo VARCHAR(100),
  error_detalle TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_notif_dest_tipo CHECK (tipo_destinatario IN ('CLIENTE','EMPLEADO')),
  CONSTRAINT chk_notif_canal CHECK (canal IN ('WHATSAPP','SMS','EMAIL')),
  CONSTRAINT chk_notif_estado CHECK (estado IN ('PENDIENTE','ENVIADA','FALLIDA','CANCELADA'))
);

-- reglas_comision
CREATE TABLE reglas_comision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  rol_aplicable VARCHAR(50),
  tipo_calculo VARCHAR(20) NOT NULL,
  monto_fijo NUMERIC(10,2) NOT NULL DEFAULT 0,
  porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  concepto VARCHAR(50) NOT NULL,
  condiciones JSONB,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_regla_tipo_calc CHECK (tipo_calculo IN ('FIJO','PORCENTAJE','MIXTO')),
  CONSTRAINT chk_regla_concepto CHECK (concepto IN ('DESEMBOLSO','RECUPERACION_MORA','EFECTIVIDAD_RUTA','META_MENSUAL')),
  CONSTRAINT chk_regla_estado CHECK (estado IN ('ACTIVA','INACTIVA'))
);

CREATE TRIGGER trg_updated_at_reglas_comision
  BEFORE UPDATE ON reglas_comision
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- comisiones
CREATE TABLE comisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  regla_comision_id UUID NOT NULL REFERENCES reglas_comision(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  prestamo_id UUID REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  entity_type VARCHAR(50),
  entity_id UUID,
  monto_calculado NUMERIC(10,2) NOT NULL,
  monto_final NUMERIC(10,2),
  motivo_override TEXT,
  pagare_recibido BOOLEAN NOT NULL DEFAULT FALSE,
  aprobado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_aprobacion TIMESTAMPTZ,
  estado VARCHAR(20) NOT NULL DEFAULT 'CALCULADA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_comision_estado CHECK (estado IN ('CALCULADA','PENDIENTE_VALIDACION','APROBADA','RECHAZADA','BLOQUEADA_PAGARE','PAGADA'))
);

CREATE TRIGGER trg_updated_at_comisiones
  BEFORE UPDATE ON comisiones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- audit_logs (tabla base — será reemplazada por particionada en migración 12)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Protección de inmutabilidad
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
