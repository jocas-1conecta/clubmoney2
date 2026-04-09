export type UserRole =
  | 'ASESOR_COMERCIAL'
  | 'COBRADOR_VERIFICADOR'
  | 'SUPERVISOR'
  | 'TESORERIA'
  | 'ASESOR_ADMINISTRATIVO'
  | 'GERENCIA'

export interface UserProfile {
  id: string
  dni: string
  nombre_completo: string
  telefono: string | null
  email: string | null
  foto_url: string | null
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'
  created_at: string
  updated_at: string
}

export interface UserRoleRecord {
  id: string
  usuario_id: string
  rol_id: string
  roles: {
    nombre: UserRole
  }
}
