-- ============================================================
-- MIGRACIÓN 02: CAPA 2 — Clientes y Originación de Crédito
-- ============================================================

-- clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni VARCHAR(8) UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  telefono VARCHAR(15),
  telefono_secundario VARCHAR(15),
  email TEXT,
  direccion TEXT,
  referencia_direccion TEXT,
  zona_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  es_cliente_recurrente BOOLEAN NOT NULL DEFAULT FALSE,
  calificacion_interna VARCHAR(20),
  foto_url TEXT,
  registrado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_clientes_dni_length CHECK (LENGTH(dni) = 8),
  CONSTRAINT chk_clientes_estado CHECK (estado IN ('ACTIVO','INACTIVO','BLOQUEADO')),
  CONSTRAINT chk_clientes_calificacion CHECK (calificacion_interna IS NULL OR calificacion_interna IN ('EXCELENTE','BUENO','REGULAR','MALO'))
);

CREATE TRIGGER trg_updated_at_clientes
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- solicitudes_prestamo
CREATE TABLE solicitudes_prestamo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  asesor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  monto_solicitado NUMERIC(10,2) NOT NULL,
  plazo_dias INTEGER NOT NULL,
  tasa_interes NUMERIC(5,2) NOT NULL,
  tipo_cronograma VARCHAR(20) NOT NULL,
  es_renovacion BOOLEAN NOT NULL DEFAULT FALSE,
  prestamo_anterior_id UUID, -- FK se agrega en migración 03 (dependencia circular)
  requiere_verificacion_campo BOOLEAN NOT NULL DEFAULT TRUE,
  validacion_biometrica_ok BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_rechazo TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'INGRESADA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_solicitud_cronograma CHECK (tipo_cronograma IN ('FIJO','FLEXIBLE','HIBRIDO')),
  CONSTRAINT chk_solicitud_estado CHECK (estado IN ('INGRESADA','EN_EVALUACION','VERIFICACION_CAMPO','APROBADA','RECHAZADA','OBSERVADA','EN_FORMALIZACION'))
);

CREATE TRIGGER trg_updated_at_solicitudes
  BEFORE UPDATE ON solicitudes_prestamo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- documentos_solicitud
CREATE TABLE documentos_solicitud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes_prestamo(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_documento VARCHAR(50) NOT NULL,
  url_archivo TEXT NOT NULL,
  estado_validacion VARCHAR(20) NOT NULL DEFAULT 'RECIBIDO',
  validado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_doc_tipo CHECK (tipo_documento IN ('DNI_FRONTAL','DNI_REVERSO','RECIBO_LUZ','CONTRATO_ALQUILER','SELFIE','PRUEBA_VIDA')),
  CONSTRAINT chk_doc_validacion CHECK (estado_validacion IN ('RECIBIDO','VALIDADO','RECHAZADO','BORROSO'))
);

-- seeker_resultados
CREATE TABLE seeker_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes_prestamo(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  score INTEGER,
  resumen_deudas JSONB,
  resultado_raw JSONB,
  fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado VARCHAR(20) NOT NULL DEFAULT 'PROCESADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_seeker_estado CHECK (estado IN ('PROCESADO','ERROR','PENDIENTE'))
);

-- visitas_presenciales
CREATE TABLE visitas_presenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES solicitudes_prestamo(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  verificador_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_visita VARCHAR(30) NOT NULL,
  lat NUMERIC(10,7),
  lon NUMERIC(10,7),
  fecha_programada TIMESTAMPTZ,
  fecha_ejecutada TIMESTAMPTZ,
  estado_visita VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_visita_tipo CHECK (tipo_visita IN ('VERIFICACION','COBRANZA','RECUPERACION')),
  CONSTRAINT chk_visita_estado CHECK (estado_visita IN ('PROGRAMADA','EN_CURSO','COMPLETADA','AUSENTE','SIN_DINERO','REPROGRAMADA'))
);

CREATE TRIGGER trg_updated_at_visitas
  BEFORE UPDATE ON visitas_presenciales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- evidencias
CREATE TABLE evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID NOT NULL REFERENCES visitas_presenciales(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_evidencia VARCHAR(30) NOT NULL,
  url_archivo TEXT,
  lat NUMERIC(10,7),
  lon NUMERIC(10,7),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_evidencia_tipo CHECK (tipo_evidencia IN ('FOTO_FACHADA','FOTO_NEGOCIO','FOTO_DNI','GEOLOCALIZACION','VIDEO'))
);

-- referencias_entorno
CREATE TABLE referencias_entorno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID NOT NULL REFERENCES visitas_presenciales(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  solicitud_id UUID NOT NULL REFERENCES solicitudes_prestamo(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  buen_pagador BOOLEAN,
  problemas_pago BOOLEAN,
  otros_prestamistas BOOLEAN,
  vivienda_propia BOOLEAN,
  negocio_visible BOOLEAN,
  comentarios_vecinos TEXT,
  notas_verificador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- revisiones_supervisor
CREATE TABLE revisiones_supervisor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes_prestamo(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  supervisor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  dictamen VARCHAR(20) NOT NULL,
  monto_aprobado NUMERIC(10,2),
  tasa_aprobada NUMERIC(5,2),
  plazo_aprobado INTEGER,
  condiciones_especiales TEXT,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_revision_dictamen CHECK (dictamen IN ('APROBADO','RECHAZADO','OBSERVADO'))
);
