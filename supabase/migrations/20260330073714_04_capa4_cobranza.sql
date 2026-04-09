-- ============================================================
-- MIGRACIÓN 04: CAPA 4 — Cobranza Diaria
-- ============================================================

-- rutas_cobranza
CREATE TABLE rutas_cobranza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cobrador_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_ruta DATE NOT NULL,
  total_clientes INTEGER NOT NULL DEFAULT 0,
  total_recaudado NUMERIC(10,2) NOT NULL DEFAULT 0,
  saldo_mano NUMERIC(10,2) NOT NULL DEFAULT 0,
  saldo_inicial_custodia NUMERIC(10,2) NOT NULL DEFAULT 0,
  hora_inicio TIMESTAMPTZ,
  hora_cierre TIMESTAMPTZ,
  url_voucher_deposito TEXT,
  aprobado_custodia_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  estado VARCHAR(20) NOT NULL DEFAULT 'PLANIFICADA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ruta_estado CHECK (estado IN ('PLANIFICADA','EN_CURSO','CERRADA','CIERRE_CON_CUSTODIA'))
);

CREATE TRIGGER trg_updated_at_rutas
  BEFORE UPDATE ON rutas_cobranza
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ruta_clientes
CREATE TABLE ruta_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES rutas_cobranza(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  orden_visita INTEGER NOT NULL,
  monto_esperado NUMERIC(10,2),
  monto_cobrado NUMERIC(10,2) NOT NULL DEFAULT 0,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  instruccion_especial TEXT,
  estado_visita VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  fecha_visita TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ruta_cli_prioridad CHECK (prioridad IN ('NORMAL','ALTA','URGENTE')),
  CONSTRAINT chk_ruta_cli_estado CHECK (estado_visita IN ('PENDIENTE','VISITADO','AUSENTE','SIN_DINERO','COBRADO','PAGO_PARCIAL'))
);

CREATE TRIGGER trg_updated_at_ruta_clientes
  BEFORE UPDATE ON ruta_clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- pagos
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cuota_id UUID REFERENCES cuotas_programadas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ruta_cliente_id UUID REFERENCES ruta_clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cobrador_id UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  monto NUMERIC(10,2) NOT NULL,
  medio_pago VARCHAR(30) NOT NULL,
  fecha_pago TIMESTAMPTZ NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  numero_operacion VARCHAR(50),
  banco_origen VARCHAR(50),
  lat NUMERIC(10,7),
  lon NUMERIC(10,7),
  sync_pending BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_anulacion TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pago_medio CHECK (medio_pago IN ('EFECTIVO','YAPE','PLIN','TRANSFERENCIA_BANCARIA')),
  CONSTRAINT chk_pago_estado CHECK (estado IN ('REGISTRADO','RECAUDADO_EN_CAMPO','PENDIENTE_CONCILIACION','CONCILIADO','ANULADO','EXTORNADO'))
);

CREATE TRIGGER trg_updated_at_pagos
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- registro_billetes
CREATE TABLE registro_billetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  numero_serie VARCHAR(30) NOT NULL,
  denominacion NUMERIC(10,2) NOT NULL,
  foto_url TEXT NOT NULL,
  registrado_por UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  validado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_validacion TIMESTAMPTZ,
  motivo_rechazo TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO_CAMPO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_billete_estado CHECK (estado IN ('REGISTRADO_CAMPO','VALIDADO_TESORERIA','RECHAZADO','SOSPECHOSO'))
);

CREATE TRIGGER trg_updated_at_billetes
  BEFORE UPDATE ON registro_billetes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- vouchers
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  url_archivo TEXT NOT NULL,
  id_operacion_extraido VARCHAR(50),
  banco_extraido VARCHAR(50),
  monto_extraido NUMERIC(10,2),
  emisor_extraido TEXT,
  procesado_ocr BOOLEAN NOT NULL DEFAULT FALSE,
  resultado_ocr_raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cuadernos_cliente
CREATE TABLE cuadernos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID UNIQUE NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  saldo_actual NUMERIC(10,2) NOT NULL,
  total_pagado NUMERIC(10,2) NOT NULL DEFAULT 0,
  ultimo_pago_fecha TIMESTAMPTZ,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cuaderno_estado CHECK (estado IN ('ACTIVO','CERRADO'))
);

CREATE TRIGGER trg_updated_at_cuadernos
  BEFORE UPDATE ON cuadernos_cliente
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- registros_cuaderno
CREATE TABLE registros_cuaderno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuaderno_id UUID NOT NULL REFERENCES cuadernos_cliente(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  pago_id UUID REFERENCES pagos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_registro VARCHAR(30) NOT NULL,
  descripcion TEXT,
  monto NUMERIC(10,2),
  saldo_anterior NUMERIC(10,2),
  saldo_nuevo NUMERIC(10,2),
  registrado_por UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_reg_cuaderno_tipo CHECK (tipo_registro IN ('PAGO','NOTA_CAMPO','VISITA_FALLIDA','AJUSTE','NOTIFICACION_ENVIADA'))
);
