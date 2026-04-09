-- ============================================================
-- MIGRACIÓN 06: CAPA 6 — Gestión de Morosidad y Refinanciamiento
-- ============================================================

-- casos_morosidad
CREATE TABLE casos_morosidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  dias_sin_pago INTEGER NOT NULL,
  monto_vencido NUMERIC(10,2) NOT NULL,
  fecha_inicio_mora DATE NOT NULL,
  categoria_mora VARCHAR(30) NOT NULL,
  asignado_a UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tiene_promesa_pago BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_promesa_pago DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_mora_categoria CHECK (categoria_mora IN ('MORA_TEMPRANA','MORA_MEDIA','MORA_GRAVE','PREJURIDICO')),
  CONSTRAINT chk_mora_estado CHECK (estado IN ('ABIERTO','EN_GESTION','RECUPERADO','REFINANCIADO','ESCALADO_CAMPO','CASTIGO'))
);

CREATE TRIGGER trg_updated_at_morosidad
  BEFORE UPDATE ON casos_morosidad
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- acciones_morosidad
CREATE TABLE acciones_morosidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos_morosidad(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ejecutado_por UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo_accion VARCHAR(30) NOT NULL,
  descripcion TEXT,
  resultado TEXT,
  fecha_proxima_accion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_accion_tipo CHECK (tipo_accion IN ('LLAMADA','WHATSAPP','SMS','EMAIL','VISITA_CAMPO','NOTIFICACION_EMBARGO','PROMESA_PAGO','ACUERDO_PAGO'))
);

-- novaciones
CREATE TABLE novaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_morosidad_id UUID NOT NULL REFERENCES casos_morosidad(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  supervisor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  prestamo_original_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  prestamo_nuevo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  capital_remanente NUMERIC(10,2) NOT NULL,
  interes_pendiente NUMERIC(10,2) NOT NULL,
  mora_acumulada NUMERIC(10,2) NOT NULL,
  saldo_total_deudor NUMERIC(10,2) NOT NULL,
  descuento_condonacion NUMERIC(10,2) NOT NULL DEFAULT 0,
  motivo_condonacion TEXT,
  capital_nuevo NUMERIC(10,2) NOT NULL,
  condiciones_nuevas JSONB,
  estado VARCHAR(20) NOT NULL DEFAULT 'PROPUESTA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_novacion_estado CHECK (estado IN ('PROPUESTA','APROBADA','EJECUTADA','ANULADA'))
);

CREATE TRIGGER trg_updated_at_novaciones
  BEFORE UPDATE ON novaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
