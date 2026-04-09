export interface Prestamo {
  id: string
  solicitud_id: string
  cliente_id: string
  zona_id: string | null
  asesor_id: string | null
  grupo_credito_id: string
  prestamo_origen_id: string | null
  monto_capital: number
  monto_interes: number
  monto_total_pagar: number
  saldo_pendiente: number
  tasa_interes: number
  plazo_dias: number
  tipo_cronograma: 'FIJO' | 'FLEXIBLE' | 'HIBRIDO'
  cuota_diaria: number | null
  cuota_minima_sugerida: number | null
  fecha_desembolso: string | null
  fecha_vencimiento: string
  fecha_cancelacion: string | null
  estado: PrestamoEstado
  created_at: string
  updated_at: string

  /* Joined */
  cliente?: { nombre_completo: string; dni: string; foto_url: string | null }
  asesor?: { nombre_completo: string }
  zona?: { nombre: string }
}

export type PrestamoEstado =
  | 'PENDIENTE_DESEMBOLSO'
  | 'ACTIVO'
  | 'CANCELADO'
  | 'CANCELADO_POR_REFINANCIACION'
  | 'VENCIDO'
  | 'EN_MORA'
