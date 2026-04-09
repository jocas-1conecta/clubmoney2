-- ============================================================
-- MIGRACIÓN 09: Triggers de Negocio (Transaccionales)
-- ============================================================

-- 1. Alerta de billete duplicado (antifraude)
CREATE OR REPLACE FUNCTION check_billete_duplicado()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM registro_billetes
    WHERE numero_serie = NEW.numero_serie
    AND id != NEW.id
  ) THEN
    NEW.estado := 'SOSPECHOSO';
    INSERT INTO audit_logs (usuario_id, accion_realizada, tabla_afectada, registro_id, valor_nuevo, motivo)
    VALUES (
      NEW.registrado_por,
      'ALERTA_BILLETE_DUPLICADO',
      'registro_billetes',
      NEW.id,
      jsonb_build_object('numero_serie', NEW.numero_serie, 'pago_id', NEW.pago_id),
      'Número de serie ya registrado en el sistema'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_billete_duplicado
  BEFORE INSERT ON registro_billetes
  FOR EACH ROW EXECUTE FUNCTION check_billete_duplicado();

-- 2. Actualización de saldo al conciliar pago
CREATE OR REPLACE FUNCTION update_saldo_on_conciliacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'CONCILIADO' AND OLD.estado != 'CONCILIADO' THEN
    -- Actualizar saldo del préstamo
    UPDATE prestamos
    SET saldo_pendiente = saldo_pendiente - NEW.monto,
        updated_at = NOW()
    WHERE id = NEW.prestamo_id;

    -- Actualizar cuaderno del cliente
    UPDATE cuadernos_cliente
    SET saldo_actual = saldo_actual - NEW.monto,
        total_pagado = total_pagado + NEW.monto,
        ultimo_pago_fecha = NEW.fecha_pago,
        updated_at = NOW()
    WHERE prestamo_id = NEW.prestamo_id;

    -- Actualizar cuota si existe
    IF NEW.cuota_id IS NOT NULL THEN
      UPDATE cuotas_programadas
      SET monto_pagado = monto_pagado + NEW.monto,
          estado = CASE
            WHEN monto_pagado + NEW.monto >= monto_cuota THEN 'PAGADA'
            ELSE 'PARCIAL'
          END,
          updated_at = NOW()
      WHERE id = NEW.cuota_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_saldo_conciliacion
  AFTER UPDATE OF estado ON pagos
  FOR EACH ROW
  WHEN (NEW.estado = 'CONCILIADO' AND OLD.estado != 'CONCILIADO')
  EXECUTE FUNCTION update_saldo_on_conciliacion();

-- 3. Bloqueo/desbloqueo de comisión por pagaré
CREATE OR REPLACE FUNCTION sync_comision_pagare()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recibido = TRUE AND OLD.recibido = FALSE THEN
    UPDATE comisiones
    SET pagare_recibido = TRUE,
        estado = CASE
          WHEN estado = 'BLOQUEADA_PAGARE' THEN 'PENDIENTE_VALIDACION'
          ELSE estado
        END,
        updated_at = NOW()
    WHERE prestamo_id = NEW.prestamo_id
    AND pagare_recibido = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_comision_pagare
  AFTER UPDATE OF recibido ON recepcion_pagares
  FOR EACH ROW
  WHEN (NEW.recibido = TRUE AND OLD.recibido = FALSE)
  EXECUTE FUNCTION sync_comision_pagare();

-- 4. Detección de conflictos de sincronización offline
CREATE OR REPLACE FUNCTION detect_sync_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cuota_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM pagos
    WHERE cuota_id = NEW.cuota_id
    AND id != NEW.id
    AND estado NOT IN ('ANULADO', 'EXTORNADO')
  ) THEN
    INSERT INTO inconsistencias_pago (
      pago_id, tipo_inconsistencia, descripcion, estado
    ) VALUES (
      NEW.id,
      'PAGO_DUPLICADO_SYNC',
      'Pago registrado offline coincide con pago existente para la misma cuota. cuota_id: ' || NEW.cuota_id::TEXT,
      'ABIERTA'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detect_sync_conflict
  AFTER INSERT ON pagos
  FOR EACH ROW
  WHEN (NEW.sync_pending = TRUE)
  EXECUTE FUNCTION detect_sync_conflict();
