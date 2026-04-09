-- ============================================================
-- MIGRACIÓN 07b: Funciones RLS (dependen de tablas RBAC)
-- Ejecutar DESPUÉS de crear todas las tablas
-- ============================================================

-- 1. Obtener roles del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TEXT[] AS $$
  SELECT COALESCE(ARRAY_AGG(r.nombre), ARRAY[]::TEXT[])
  FROM usuario_roles ur
  JOIN roles r ON r.id = ur.rol_id
  WHERE ur.usuario_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Verificar si el usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN roles r ON r.id = ur.rol_id
    WHERE ur.usuario_id = auth.uid()
    AND r.nombre = role_name
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Obtener IDs de zonas activas del usuario
CREATE OR REPLACE FUNCTION public.get_user_zona_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(ARRAY_AGG(az.zona_id), ARRAY[]::UUID[])
  FROM asignaciones_zona az
  WHERE az.usuario_id = auth.uid()
  AND az.activo = TRUE
  AND (az.fecha_fin IS NULL OR az.fecha_fin >= CURRENT_DATE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Verificar si el usuario tiene un permiso específico (RBAC + overrides)
CREATE OR REPLACE FUNCTION public.has_permission(permission_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_deny BOOLEAN;
  has_grant BOOLEAN;
  has_role_perm BOOLEAN;
BEGIN
  -- 1. Verificar DENY individual (máxima prioridad)
  SELECT EXISTS (
    SELECT 1 FROM usuario_permisos up
    JOIN permisos p ON p.id = up.permiso_id
    WHERE up.usuario_id = auth.uid()
    AND p.codigo = permission_code
    AND up.tipo = 'DENY'
  ) INTO has_deny;
  IF has_deny THEN RETURN FALSE; END IF;

  -- 2. Verificar GRANT individual
  SELECT EXISTS (
    SELECT 1 FROM usuario_permisos up
    JOIN permisos p ON p.id = up.permiso_id
    WHERE up.usuario_id = auth.uid()
    AND p.codigo = permission_code
    AND up.tipo = 'GRANT'
  ) INTO has_grant;
  IF has_grant THEN RETURN TRUE; END IF;

  -- 3. Verificar permisos heredados por roles
  SELECT EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN rol_permisos rp ON rp.rol_id = ur.rol_id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE ur.usuario_id = auth.uid()
    AND p.codigo = permission_code
  ) INTO has_role_perm;
  RETURN has_role_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
