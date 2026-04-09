export interface CasoMorosidad {
  id: string
  prestamo_id: string
  cliente_id: string
  dias_sin_pago: number
  monto_vencido: number
  fecha_inicio_mora: string
  categoria_mora: CategoriaMora
  asignado_a: string | null
  tiene_promesa_pago: boolean
  fecha_promesa_pago: string | null
  estado: MorosidadEstado
  created_at: string
  updated_at: string

  /* Joined */
  cliente?: { nombre_completo: string; dni: string; foto_url: string | null; telefono: string | null }
  asignado?: { nombre_completo: string }
  prestamo?: { monto_capital: number; saldo_pendiente: number; fecha_vencimiento: string }
}

export type CategoriaMora = 'MORA_TEMPRANA' | 'MORA_MEDIA' | 'MORA_GRAVE' | 'PREJURIDICO'

export type MorosidadEstado =
  | 'ABIERTO'
  | 'EN_GESTION'
  | 'RECUPERADO'
  | 'REFINANCIADO'
  | 'ESCALADO_CAMPO'
  | 'CASTIGO'

export interface AccionMorosidad {
  id: string
  caso_id: string
  ejecutado_por: string
  tipo_accion: string
  descripcion: string | null
  resultado: string | null
  fecha_proxima_accion: string | null
  created_at: string

  ejecutor?: { nombre_completo: string }
}
