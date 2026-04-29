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
  url_voucher_deposito: string | null
  aprobado_custodia_por: string | null
  estado: RutaEstado
  created_at: string
  updated_at: string

  /* Joined */
  cobrador?: { nombre_completo: string }
  zona?: { nombre: string }
}

export type RutaEstado = 'PLANIFICADA' | 'EN_CURSO' | 'CERRADA' | 'CIERRE_CON_CUSTODIA'

export interface RutaCliente {
  id: string
  ruta_id: string
  cliente_id: string
  prestamo_id: string
  orden_visita: number
  monto_esperado: number | null
  monto_cobrado: number
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE'
  instruccion_especial: string | null
  estado_visita: EstadoVisita
  fecha_visita: string | null
  created_at: string
  updated_at: string

  /* Joined */
  cliente?: {
    nombre_completo: string
    dni: string
    foto_url: string | null
    telefono: string | null
  }
  prestamo?: {
    monto_total_pagar: number
    saldo_pendiente: number
    cuota_diaria: number | null
    tipo_cronograma: string
  }
}

export type EstadoVisita =
  | 'PENDIENTE'
  | 'VISITADO'
  | 'AUSENTE'
  | 'SIN_DINERO'
  | 'COBRADO'
  | 'PAGO_PARCIAL'

export interface Pago {
  id: string
  prestamo_id: string
  cliente_id: string
  cuota_id: string | null
  ruta_cliente_id: string | null
  cobrador_id: string | null
  monto: number
  medio_pago: MedioPago
  fecha_pago: string
  fecha_registro: string
  numero_operacion: string | null
  estado: PagoEstado
  created_at: string

  /* Joined */
  cliente?: { nombre_completo: string; dni: string; foto_url: string | null }
  cobrador?: { nombre_completo: string }
}

export type MedioPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA_BANCARIA'

export type PagoEstado =
  | 'REGISTRADO'
  | 'RECAUDADO_EN_CAMPO'
  | 'PENDIENTE_CONCILIACION'
  | 'CONCILIADO'
  | 'ANULADO'
  | 'EXTORNADO'

export interface NuevoPagoForm {
  prestamo_id: string
  cliente_id: string
  ruta_cliente_id: string
  cobrador_id: string
  monto: number
  medio_pago: MedioPago
  numero_operacion?: string
  banco_origen?: string
}

export interface RutaResumen {
  totalClientes: number
  visitados: number
  pendientes: number
  cobrados: number
  totalEsperado: number
  totalCobrado: number
  efectivo: number
  digital: number
}
