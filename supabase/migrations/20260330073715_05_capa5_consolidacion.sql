-- ============================================================
-- MIGRACIÓN 05: CAPA 5 — Consolidación y Conciliación de Pagos
-- ============================================================

-- movimientos_bancarios
CREATE TABLE movimientos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_importacion_id UUID,
  cuenta_bancaria VARCHAR(30) NOT NULL,
  banco VARCHAR(50) NOT NULL,
  fecha_movimiento DATE NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  referencia VARCHAR(100),
  tipo_movimiento VARCHAR(20),
  origen VARCHAR(30),
  importado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_mov_tipo CHECK (tipo_movimiento IS NULL OR tipo_movimiento IN ('ABONO','CARGO')),
  CONSTRAINT chk_mov_origen CHECK (origen IS NULL OR origen IN ('IMPORTACION_ARCHIVO','MANUAL')),
  CONSTRAINT chk_mov_estado CHECK (estado IN ('PENDIENTE','CONCILIADO','SIN_COINCIDENCIA'))
);

-- conciliaciones
CREATE TABLE conciliaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_conciliacion DATE NOT NULL,
  ejecutado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'AUTOMATICA',
  total_procesados INTEGER NOT NULL DEFAULT 0,
  total_exitosos INTEGER NOT NULL DEFAULT 0,
  total_fallidos INTEGER NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_conc_tipo CHECK (tipo IN ('AUTOMATICA','MANUAL')),
  CONSTRAINT chk_conc_estado CHECK (estado IN ('EN_PROCESO','FINALIZADA','CERRADA'))
);

CREATE TRIGGER trg_updated_at_conciliaciones
  BEFORE UPDATE ON conciliaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- conciliacion_detalle
CREATE TABLE conciliacion_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacion_id UUID NOT NULL REFERENCES conciliaciones(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  movimiento_bancario_id UUID REFERENCES movimientos_bancarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  coincide BOOLEAN NOT NULL DEFAULT FALSE,
  monto_pago NUMERIC(10,2),
  monto_banco NUMERIC(10,2),
  diferencia NUMERIC(10,2),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- inconsistencias_pago
CREATE TABLE inconsistencias_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacion_id UUID REFERENCES conciliaciones(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  movimiento_bancario_id UUID REFERENCES movimientos_bancarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_inconsistencia VARCHAR(50) NOT NULL,
  descripcion TEXT,
  resolucion TEXT,
  resuelto_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_resolucion TIMESTAMPTZ,
  estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_incons_tipo CHECK (tipo_inconsistencia IN ('MONTO_DIFIERE','VOUCHER_ILEGIBLE','DEPOSITO_NO_FIGURA','PAGO_SIN_MOVIMIENTO','MOVIMIENTO_SIN_PAGO','BILLETE_RECHAZADO','PAGO_DUPLICADO_SYNC')),
  CONSTRAINT chk_incons_estado CHECK (estado IN ('ABIERTA','EN_REVISION','RESUELTA'))
);

CREATE TRIGGER trg_updated_at_inconsistencias
  BEFORE UPDATE ON inconsistencias_pago
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
