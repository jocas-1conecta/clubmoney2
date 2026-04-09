export type ClienteEstado = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'
export type CalificacionInterna = 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'MALO'

export interface Cliente {
  id: string
  dni: string
  nombre_completo: string
  telefono: string | null
  telefono_secundario: string | null
  email: string | null
  direccion: string | null
  referencia_direccion: string | null
  zona_id: string | null
  es_cliente_recurrente: boolean
  calificacion_interna: CalificacionInterna | null
  foto_url: string | null
  registrado_por: string | null
  estado: ClienteEstado
  created_at: string
  updated_at: string
  // Joined fields
  zona?: { id: string; nombre: string } | null
  registrador?: { nombre_completo: string } | null
}

export interface ClienteFormData {
  dni: string
  nombre_completo: string
  telefono?: string
  telefono_secundario?: string
  email?: string
  direccion?: string
  referencia_direccion?: string
  zona_id?: string
  calificacion_interna?: CalificacionInterna
  estado?: ClienteEstado
}

export interface Zona {
  id: string
  nombre: string
  descripcion: string | null
  estado: 'ACTIVA' | 'INACTIVA'
}
