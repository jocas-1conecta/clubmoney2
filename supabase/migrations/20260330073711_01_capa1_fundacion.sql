-- ============================================================
-- MIGRACIÓN 01: CAPA 1 — Fundación
-- Usuarios, Roles, Permisos, Zonas, Configuración
-- ============================================================

-- perfiles (extiende auth.users)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  dni VARCHAR(8) UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  telefono VARCHAR(15),
  email TEXT,
  foto_url TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_perfiles_dni_length CHECK (LENGTH(dni) = 8),
  CONSTRAINT chk_perfiles_estado CHECK (estado IN ('ACTIVO','INACTIVO','SUSPENDIDO'))
);

CREATE TRIGGER trg_updated_at_perfiles
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_roles_nombre CHECK (nombre IN ('ASESOR_COMERCIAL','COBRADOR_VERIFICADOR','SUPERVISOR','TESORERIA','ASESOR_ADMINISTRATIVO','GERENCIA')),
  CONSTRAINT chk_roles_estado CHECK (estado IN ('ACTIVO','INACTIVO'))
);

-- permisos
CREATE TABLE permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) UNIQUE NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_permisos_estado CHECK (estado IN ('ACTIVO','INACTIVO'))
);

-- rol_permisos (M:M)
CREATE TABLE rol_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rol_permisos UNIQUE (rol_id, permiso_id)
);

-- usuario_roles (M:M)
CREATE TABLE usuario_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  asignado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_usuario_roles UNIQUE (usuario_id, rol_id)
);

-- usuario_permisos (overrides granulares)
CREATE TABLE usuario_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  tipo VARCHAR(10) NOT NULL,
  motivo TEXT,
  asignado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_usuario_permisos UNIQUE (usuario_id, permiso_id),
  CONSTRAINT chk_usuario_permisos_tipo CHECK (tipo IN ('GRANT','DENY'))
);

-- zonas
CREATE TABLE zonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_zonas_estado CHECK (estado IN ('ACTIVA','INACTIVA'))
);

CREATE TRIGGER trg_updated_at_zonas
  BEFORE UPDATE ON zonas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- asignaciones_zona
CREATE TABLE asignaciones_zona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  asignado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- configuracion_sistema
CREATE TABLE configuracion_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(100) NOT NULL,
  valor JSONB NOT NULL,
  tipo_dato VARCHAR(20) NOT NULL,
  descripcion TEXT,
  zona_id UUID REFERENCES zonas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  actualizado_por UUID REFERENCES perfiles(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_config_clave_zona UNIQUE (clave, zona_id),
  CONSTRAINT chk_config_tipo_dato CHECK (tipo_dato IN ('NUMBER','STRING','BOOLEAN','JSON'))
);

CREATE TRIGGER trg_updated_at_configuracion
  BEFORE UPDATE ON configuracion_sistema
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Seed: Roles iniciales
-- ============================================================
INSERT INTO roles (nombre, descripcion) VALUES
  ('ASESOR_COMERCIAL', 'Operativo/Ventas. Acceso limitado a sus propios prospectos.'),
  ('COBRADOR_VERIFICADOR', 'Operativo/Móvil. Acceso por geolocalización y ruta asignada.'),
  ('SUPERVISOR', 'Táctico/Aprobador. Acceso a excepciones y riesgos.'),
  ('TESORERIA', 'Administrativo/Pagador. Acceso a flujo de dinero saliente.'),
  ('ASESOR_ADMINISTRATIVO', 'Gestión y Auditoría Operativa.'),
  ('GERENCIA', 'Supervisión global con Dashboard y alertas de riesgo.');
