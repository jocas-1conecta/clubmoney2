export interface Solicitud {
  id: string
  cliente_id: string
  asesor_id: string
  monto_solicitado: number
  plazo_dias: number
  tasa_interes: number
  tipo_cronograma: 'FIJO' | 'FLEXIBLE' | 'HIBRIDO'
  es_renovacion: boolean
  prestamo_anterior_id: string | null
  requiere_verificacion_campo: boolean
  validacion_biometrica_ok: boolean
  motivo_rechazo: string | null
  estado: SolicitudEstado
  created_at: string
  updated_at: string

  /* Joined */
  cliente?: { nombre_completo: string; dni: string; foto_url: string | null; telefono: string | null }
  asesor?: { nombre_completo: string }
}

export type SolicitudEstado =
  | 'INGRESADA'
  | 'EN_EVALUACION'
  | 'VERIFICACION_CAMPO'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'OBSERVADA'
  | 'EN_FORMALIZACION'

export interface SolicitudFormData {
  cliente_id: string
  monto_solicitado: number
  plazo_dias: number
  tasa_interes: number
  tipo_cronograma: 'FIJO' | 'FLEXIBLE' | 'HIBRIDO'
  es_renovacion?: boolean
  requiere_verificacion_campo?: boolean
}
