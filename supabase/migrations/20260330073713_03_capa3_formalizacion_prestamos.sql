-- ============================================================
-- MIGRACIÓN 03: CAPA 3 — Formalización, Préstamos y Desembolso
-- ============================================================

-- prestamos
CREATE TABLE prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes_prestamo(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  zona_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  asesor_id UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  grupo_credito_id UUID NOT NULL,
  prestamo_origen_id UUID REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  monto_capital NUMERIC(10,2) NOT NULL,
  monto_interes NUMERIC(10,2) NOT NULL,
  monto_total_pagar NUMERIC(10,2) NOT NULL,
  saldo_pendiente NUMERIC(10,2) NOT NULL,
  tasa_interes NUMERIC(5,2) NOT NULL,
  plazo_dias INTEGER NOT NULL,
  tipo_cronograma VARCHAR(20) NOT NULL,
  cuota_diaria NUMERIC(10,2),
  cuota_minima_sugerida NUMERIC(10,2),
  fecha_desembolso DATE,
  fecha_vencimiento DATE NOT NULL,
  fecha_cancelacion TIMESTAMPTZ,
  estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_DESEMBOLSO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_prestamo_cronograma CHECK (tipo_cronograma IN ('FIJO','FLEXIBLE','HIBRIDO')),
  CONSTRAINT chk_prestamo_estado CHECK (estado IN ('PENDIENTE_DESEMBOLSO','ACTIVO','CANCELADO','CANCELADO_POR_REFINANCIACION','VENCIDO','EN_MORA'))
);

CREATE TRIGGER trg_updated_at_prestamos
  BEFORE UPDATE ON prestamos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Agregar FK diferida: solicitudes_prestamo.prestamo_anterior_id → prestamos.id
ALTER TABLE solicitudes_prestamo
  ADD CONSTRAINT fk_solicitud_prestamo_anterior
  FOREIGN KEY (prestamo_anterior_id)
  REFERENCES prestamos(id)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- cuotas_programadas
CREATE TABLE cuotas_programadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  numero_cuota INTEGER NOT NULL,
  fecha_programada DATE NOT NULL,
  monto_cuota NUMERIC(10,2) NOT NULL,
  monto_pagado NUMERIC(10,2) NOT NULL DEFAULT 0,
  es_sugerida BOOLEAN NOT NULL DEFAULT FALSE,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cuota_estado CHECK (estado IN ('PENDIENTE','PARCIAL','PAGADA','VENCIDA'))
);

CREATE TRIGGER trg_updated_at_cuotas
  BEFORE UPDATE ON cuotas_programadas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- contratos
CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_contrato VARCHAR(30) NOT NULL,
  url_archivo_generado TEXT,
  url_archivo TEXT,
  firmado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_firma TIMESTAMPTZ,
  validado_por_tesoreria BOOLEAN NOT NULL DEFAULT FALSE,
  validado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  motivo_devolucion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'GENERADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_contrato_tipo CHECK (tipo_contrato IN ('CONTRATO_PRESTAMO','PAGARE')),
  CONSTRAINT chk_contrato_estado CHECK (estado IN ('GENERADO','SUBIDO','VALIDADO','DEVUELTO'))
);

CREATE TRIGGER trg_updated_at_contratos
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- recepcion_pagares
CREATE TABLE recepcion_pagares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  asesor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  recibido_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_entrega TIMESTAMPTZ,
  fecha_recepcion TIMESTAMPTZ,
  recibido BOOLEAN NOT NULL DEFAULT FALSE,
  notas TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pagare_estado CHECK (estado IN ('PENDIENTE','RECIBIDO','EXTRAVIADO'))
);

CREATE TRIGGER trg_updated_at_pagares
  BEFORE UPDATE ON recepcion_pagares
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- desembolsos
CREATE TABLE desembolsos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tesorero_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  monto NUMERIC(10,2) NOT NULL,
  medio_desembolso VARCHAR(30) NOT NULL,
  banco_destino VARCHAR(50),
  cuenta_destino VARCHAR(30),
  numero_operacion VARCHAR(50),
  url_comprobante TEXT,
  fecha_desembolso TIMESTAMPTZ NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'EJECUTADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_desembolso_medio CHECK (medio_desembolso IN ('TRANSFERENCIA_BANCARIA','EFECTIVO')),
  CONSTRAINT chk_desembolso_estado CHECK (estado IN ('EJECUTADO','ANULADO'))
);
