-- ============================================================
-- MIGRACIÓN 17: RLS para Fase 4 – Contratos, Desembolsos, Pagarés
-- ============================================================

-- 1. Políticas para contratos
CREATE POLICY "contratos_select"
  ON contratos FOR SELECT TO authenticated
  USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('TESORERIA')
    OR has_role('ASESOR_COMERCIAL') OR has_role('ASESOR_ADMINISTRATIVO')
  );

CREATE POLICY "contratos_insert"
  ON contratos FOR INSERT TO authenticated
  WITH CHECK (
    has_role('GERENCIA') OR has_role('ASESOR_COMERCIAL')
  );

CREATE POLICY "contratos_update"
  ON contratos FOR UPDATE TO authenticated
  USING (
    has_role('TESORERIA') OR has_role('GERENCIA')
  )
  WITH CHECK (
    has_role('TESORERIA') OR has_role('GERENCIA')
  );

-- 2. Políticas para desembolsos
CREATE POLICY "desembolsos_select"
  ON desembolsos FOR SELECT TO authenticated
  USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR') OR has_role('TESORERIA')
    OR has_role('ASESOR_COMERCIAL')
  );

CREATE POLICY "desembolsos_insert"
  ON desembolsos FOR INSERT TO authenticated
  WITH CHECK (
    (has_role('TESORERIA') OR has_role('GERENCIA'))
    AND tesorero_id = auth.uid()
  );

-- 3. Políticas para recepcion_pagares
CREATE POLICY "pagares_select"
  ON recepcion_pagares FOR SELECT TO authenticated
  USING (
    has_role('GERENCIA') OR has_role('ASESOR_ADMINISTRATIVO')
    OR has_role('TESORERIA') OR has_role('ASESOR_COMERCIAL')
  );

CREATE POLICY "pagares_insert"
  ON recepcion_pagares FOR INSERT TO authenticated
  WITH CHECK (
    has_role('ASESOR_ADMINISTRATIVO') OR has_role('GERENCIA')
  );

CREATE POLICY "pagares_update"
  ON recepcion_pagares FOR UPDATE TO authenticated
  USING (
    has_role('ASESOR_ADMINISTRATIVO') OR has_role('GERENCIA')
  )
  WITH CHECK (
    has_role('ASESOR_ADMINISTRATIVO') OR has_role('GERENCIA')
  );

-- 4. INSERT policy for prestamos (needed to create loan after approval)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prestamos' AND policyname = 'prestamos_insert') THEN
    EXECUTE 'CREATE POLICY "prestamos_insert" ON prestamos FOR INSERT TO authenticated WITH CHECK (has_role(''GERENCIA'') OR has_role(''TESORERIA''))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prestamos' AND policyname = 'prestamos_update') THEN
    EXECUTE 'CREATE POLICY "prestamos_update" ON prestamos FOR UPDATE TO authenticated USING (has_role(''GERENCIA'') OR has_role(''TESORERIA'') OR has_role(''SUPERVISOR'')) WITH CHECK (has_role(''GERENCIA'') OR has_role(''TESORERIA'') OR has_role(''SUPERVISOR''))';
  END IF;
END $$;
