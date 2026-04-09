-- ============================================================
-- MIGRACIÓN 16: Seed zonas + RLS para Fase 2-3 Originación
-- ============================================================

-- 1. Seed zonas de operación
INSERT INTO zonas (id, nombre) VALUES
  (gen_random_uuid(), 'ZONA NORTE'),
  (gen_random_uuid(), 'ZONA SUR'),
  (gen_random_uuid(), 'ZONA ESTE'),
  (gen_random_uuid(), 'ZONA OESTE'),
  (gen_random_uuid(), 'ZONA CENTRO')
ON CONFLICT DO NOTHING;

-- 2. Política SELECT en zonas (para que el form cargue las zonas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zonas' AND policyname = 'zonas_select') THEN
    EXECUTE 'CREATE POLICY "zonas_select" ON zonas FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 3. Habilitar RLS en zonas si no está habilitado
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;

-- 4. Política UPDATE en solicitudes_prestamo
-- SUPERVISOR y GERENCIA pueden cambiar el estado (dictamen)
CREATE POLICY "solicitudes_update"
  ON solicitudes_prestamo FOR UPDATE
  TO authenticated
  USING (
    has_role('SUPERVISOR') OR has_role('GERENCIA')
    OR asesor_id = auth.uid()
  )
  WITH CHECK (
    has_role('SUPERVISOR') OR has_role('GERENCIA')
    OR asesor_id = auth.uid()
  );

-- 5. Políticas para revisiones_supervisor
CREATE POLICY "revisiones_select"
  ON revisiones_supervisor FOR SELECT
  TO authenticated
  USING (
    has_role('GERENCIA') OR has_role('SUPERVISOR')
    OR has_role('ASESOR_COMERCIAL') OR has_role('ASESOR_ADMINISTRATIVO')
  );

CREATE POLICY "revisiones_insert"
  ON revisiones_supervisor FOR INSERT
  TO authenticated
  WITH CHECK (
    (has_role('SUPERVISOR') OR has_role('GERENCIA'))
    AND supervisor_id = auth.uid()
  );

-- 6. Políticas para seeker_resultados
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seeker_resultados') THEN
    ALTER TABLE seeker_resultados ENABLE ROW LEVEL SECURITY;
    EXECUTE 'CREATE POLICY "seeker_select" ON seeker_resultados FOR SELECT TO authenticated USING (has_role(''GERENCIA'') OR has_role(''SUPERVISOR'') OR has_role(''ASESOR_COMERCIAL''))';
    EXECUTE 'CREATE POLICY "seeker_insert" ON seeker_resultados FOR INSERT TO authenticated WITH CHECK (has_role(''GERENCIA'') OR has_role(''SUPERVISOR'') OR has_role(''ASESOR_COMERCIAL''))';
  END IF;
END $$;
