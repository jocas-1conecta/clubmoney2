-- ============================================================
-- MIGRACIÓN 00: Funciones Auxiliares (sin dependencia de tablas)
-- Las funciones que dependen de tablas RBAC se crean en migración 07b
-- ============================================================

-- 1. Trigger genérico para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Protección de inmutabilidad para audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es inmutable. No se permite UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;
