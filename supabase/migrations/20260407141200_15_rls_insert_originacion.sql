-- ============================================================
-- MIGRACIÓN 15: Políticas INSERT para Originación de Crédito
-- Permite a ASESOR_COMERCIAL y GERENCIA crear clientes,
-- solicitudes y subir documentos.
-- ============================================================

-- 1. Política INSERT para clientes
-- Solo ASESOR_COMERCIAL y GERENCIA pueden crear clientes
CREATE POLICY "clientes_insert"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('ASESOR_COMERCIAL') OR has_role('GERENCIA')
  );

-- 2. Política INSERT para solicitudes_prestamo
-- Solo ASESOR_COMERCIAL y GERENCIA pueden crear solicitudes
-- y solo pueden crear solicitudes a su nombre (asesor_id = auth.uid())
CREATE POLICY "solicitudes_insert"
  ON solicitudes_prestamo FOR INSERT
  TO authenticated
  WITH CHECK (
    (has_role('ASESOR_COMERCIAL') OR has_role('GERENCIA'))
    AND asesor_id = auth.uid()
  );

-- 3. Política INSERT para documentos_solicitud
-- Usuarios autenticados con rol de asesor o gerencia pueden subir documentos
CREATE POLICY "documentos_solicitud_insert"
  ON documentos_solicitud FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('ASESOR_COMERCIAL') OR has_role('GERENCIA')
  );

-- 4. Política SELECT para documentos_solicitud (si no existe)
CREATE POLICY "documentos_solicitud_select"
  ON documentos_solicitud FOR SELECT
  TO authenticated
  USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR has_role('ASESOR_ADMINISTRATIVO') OR has_role('TESORERIA')
    OR has_role('ASESOR_COMERCIAL')
  );
