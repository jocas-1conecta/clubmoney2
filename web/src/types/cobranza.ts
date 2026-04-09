export interface RutaCobranza {
  id: string
  cobrador_id: string
  zona_id: string
  fecha_ruta: string
  total_clientes: number
  total_recaudado: number
  saldo_mano: number
  saldo_inicial_custodia: number
  hora_inicio: string | null
  hora_cierre: string | null
  estado: 'PLANIFICADA' | 'EN_CURSO' | 'CERRADA' | 'CIERRE_CON_CUSTODIA'
  created_at: string
  updated_at: string

  /* Joined */
  cobrador?: { nombre_completo: string }
  zona?: { nombre: string }
}

export interface Pago {
  id: string
  prestamo_id: string
  cliente_id: string
  cuota_id: string | null
  ruta_cliente_id: string | null
  cobrador_id: string | null
  monto: number
  medio_pago: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA_BANCARIA'
  fecha_pago: string
  fecha_registro: string
  numero_operacion: string | null
  estado: PagoEstado
  created_at: string

  /* Joined */
  cliente?: { nombre_completo: string; dni: string; foto_url: string | null }
  cobrador?: { nombre_completo: string }
}

export type PagoEstado =
  | 'REGISTRADO'
  | 'RECAUDADO_EN_CAMPO'
  | 'PENDIENTE_CONCILIACION'
  | 'CONCILIADO'
  | 'ANULADO'
  | 'EXTORNADO'
