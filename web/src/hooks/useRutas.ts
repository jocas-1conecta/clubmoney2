import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { RutaCobranza, RutaCliente, NuevoPagoForm } from '@/types/cobranza'

/* ── List hook ── */

interface UseRutasOptions {
  page?: number
  pageSize?: number
  estado?: string
  fechaDesde?: string
  fechaHasta?: string
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

interface RutasStats {
  rutasHoy: number
  enCurso: number
  cerradas: number
  recaudadoHoy: number
}

export function useRutas(options: UseRutasOptions = {}) {
  const {
    page = 1,
    pageSize = 15,
    estado = '',
    fechaDesde = '',
    fechaHasta = '',
    sortKey = 'fecha_ruta',
    sortDirection = 'desc',
  } = options

  const [rutas, setRutas] = useState<RutaCobranza[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<RutasStats>({
    rutasHoy: 0,
    enCurso: 0,
    cerradas: 0,
    recaudadoHoy: 0,
  })
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchData() {
      try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
          .from('rutas_cobranza')
          .select(`
            *,
            cobrador:perfiles!rutas_cobranza_cobrador_id_fkey(nombre_completo),
            zona:zonas!rutas_cobranza_zona_id_fkey(nombre)
          `, { count: 'exact' })

        if (estado) query = query.eq('estado', estado)
        if (fechaDesde) query = query.gte('fecha_ruta', fechaDesde)
        if (fechaHasta) query = query.lte('fecha_ruta', fechaHasta)

        query = query
          .order(sortKey, { ascending: sortDirection === 'asc' })
          .range(from, to)

        // Today's stats in parallel
        const today = new Date().toISOString().split('T')[0]

        const [rutasResult, statsResult] = await Promise.all([
          query,
          supabase
            .from('rutas_cobranza')
            .select('estado, total_recaudado')
            .eq('fecha_ruta', today),
        ])

        if (cancelled) return

        if (rutasResult.error) {
          console.error('Error fetching rutas:', rutasResult.error)
          return
        }

        setRutas((rutasResult.data ?? []) as unknown as RutaCobranza[])
        setTotalCount(rutasResult.count ?? 0)

        // Calculate stats
        const todayRutas = statsResult.data ?? []
        setStats({
          rutasHoy: todayRutas.length,
          enCurso: todayRutas.filter((r) => r.estado === 'EN_CURSO').length,
          cerradas: todayRutas.filter((r) => r.estado === 'CERRADA' || r.estado === 'CIERRE_CON_CUSTODIA').length,
          recaudadoHoy: todayRutas.reduce((s, r) => s + Number(r.total_recaudado), 0),
        })
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, pageSize, estado, fechaDesde, fechaHasta, sortKey, sortDirection, trigger])

  return { rutas, totalCount, loading, stats, refetch }
}

/* ── Detail hook ── */

export function useRutaDetalle(rutaId: string | undefined) {
  const [ruta, setRuta] = useState<RutaCobranza | null>(null)
  const [clientes, setClientes] = useState<RutaCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    if (!rutaId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchData() {
      try {
        const [rutaResult, clientesResult] = await Promise.all([
          supabase
            .from('rutas_cobranza')
            .select(`
              *,
              cobrador:perfiles!rutas_cobranza_cobrador_id_fkey(nombre_completo),
              zona:zonas!rutas_cobranza_zona_id_fkey(nombre)
            `)
            .eq('id', rutaId)
            .single(),
          supabase
            .from('ruta_clientes')
            .select(`
              *,
              cliente:clientes!ruta_clientes_cliente_id_fkey(nombre_completo, dni, foto_url, telefono),
              prestamo:prestamos!ruta_clientes_prestamo_id_fkey(monto_total_pagar, saldo_pendiente, cuota_diaria, tipo_cronograma)
            `)
            .eq('ruta_id', rutaId)
            .order('orden_visita', { ascending: true }),
        ])

        if (cancelled) return

        if (rutaResult.error) {
          setError(rutaResult.error.message)
          return
        }

        setRuta(rutaResult.data as unknown as RutaCobranza)
        setClientes((clientesResult.data ?? []) as unknown as RutaCliente[])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando ruta')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [rutaId, trigger])

  /* ── Mutations ── */

  const iniciarRuta = useCallback(async () => {
    if (!rutaId) return { error: 'No route ID' }
    const { error } = await supabase
      .from('rutas_cobranza')
      .update({ estado: 'EN_CURSO', hora_inicio: new Date().toISOString() })
      .eq('id', rutaId)
      .eq('estado', 'PLANIFICADA')
    if (!error) refetch()
    return { error: error?.message ?? null }
  }, [rutaId, refetch])

  const cerrarRuta = useCallback(async (urlVoucherDeposito: string) => {
    if (!rutaId) return { error: 'No route ID' }
    const { error } = await supabase
      .from('rutas_cobranza')
      .update({
        estado: 'CERRADA',
        hora_cierre: new Date().toISOString(),
        url_voucher_deposito: urlVoucherDeposito,
        saldo_mano: 0,
      })
      .eq('id', rutaId)
      .eq('estado', 'EN_CURSO')
    if (!error) refetch()
    return { error: error?.message ?? null }
  }, [rutaId, refetch])

  const solicitarCustodia = useCallback(async (aprobadoPor: string) => {
    if (!rutaId) return { error: 'No route ID' }
    const { error } = await supabase
      .from('rutas_cobranza')
      .update({
        estado: 'CIERRE_CON_CUSTODIA',
        hora_cierre: new Date().toISOString(),
        aprobado_custodia_por: aprobadoPor,
      })
      .eq('id', rutaId)
      .eq('estado', 'EN_CURSO')
    if (!error) refetch()
    return { error: error?.message ?? null }
  }, [rutaId, refetch])

  const registrarPago = useCallback(async (form: NuevoPagoForm) => {
    if (!rutaId) return { error: 'No route ID' }

    const estadoPago = form.medio_pago === 'EFECTIVO'
      ? 'RECAUDADO_EN_CAMPO'
      : 'PENDIENTE_CONCILIACION'

    // 1. Create payment record
    const { error: pagoError } = await supabase
      .from('pagos')
      .insert({
        prestamo_id: form.prestamo_id,
        cliente_id: form.cliente_id,
        ruta_cliente_id: form.ruta_cliente_id,
        cobrador_id: form.cobrador_id,
        monto: form.monto,
        medio_pago: form.medio_pago,
        fecha_pago: new Date().toISOString(),
        numero_operacion: form.numero_operacion || null,
        banco_origen: form.banco_origen || null,
        estado: estadoPago,
      })

    if (pagoError) return { error: pagoError.message }

    // 2. Update ruta_clientes
    const rc = clientes.find((c) => c.id === form.ruta_cliente_id)
    const nuevoMontoCobrado = (rc?.monto_cobrado ?? 0) + form.monto
    const montoEsperado = rc?.monto_esperado ?? 0
    const estadoVisita = nuevoMontoCobrado >= montoEsperado ? 'COBRADO' : 'PAGO_PARCIAL'

    await supabase
      .from('ruta_clientes')
      .update({
        monto_cobrado: nuevoMontoCobrado,
        estado_visita: estadoVisita,
        fecha_visita: new Date().toISOString(),
      })
      .eq('id', form.ruta_cliente_id)

    // 3. Update route totals
    const nuevoRecaudado = (ruta?.total_recaudado ?? 0) + form.monto
    const nuevoSaldoMano = form.medio_pago === 'EFECTIVO'
      ? (ruta?.saldo_mano ?? 0) + form.monto
      : (ruta?.saldo_mano ?? 0)

    await supabase
      .from('rutas_cobranza')
      .update({
        total_recaudado: nuevoRecaudado,
        saldo_mano: nuevoSaldoMano,
      })
      .eq('id', rutaId)

    refetch()
    return { error: null }
  }, [rutaId, ruta, clientes, refetch])

  const marcarVisitaFallida = useCallback(async (
    rutaClienteId: string,
    estadoVisita: 'AUSENTE' | 'SIN_DINERO'
  ) => {
    const { error } = await supabase
      .from('ruta_clientes')
      .update({
        estado_visita: estadoVisita,
        fecha_visita: new Date().toISOString(),
      })
      .eq('id', rutaClienteId)
    if (!error) refetch()
    return { error: error?.message ?? null }
  }, [refetch])

  return {
    ruta,
    clientes,
    loading,
    error,
    refetch,
    iniciarRuta,
    cerrarRuta,
    solicitarCustodia,
    registrarPago,
    marcarVisitaFallida,
  }
}

/* ── Create route ── */

interface NuevaRutaForm {
  cobrador_id: string
  zona_id: string
  fecha_ruta: string
}

export async function crearRuta(form: NuevaRutaForm) {
  const { data, error } = await supabase
    .from('rutas_cobranza')
    .insert({
      cobrador_id: form.cobrador_id,
      zona_id: form.zona_id,
      fecha_ruta: form.fecha_ruta,
      estado: 'PLANIFICADA',
    })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

/* ── Fetch collectors and zones for forms ── */

export function useCollectorsAndZones() {
  const [collectors, setCollectors] = useState<{ id: string; nombre_completo: string }[]>([])
  const [zones, setZones] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const [cRes, zRes] = await Promise.all([
        supabase
          .from('perfiles')
          .select('id, nombre_completo')
          .eq('estado', 'ACTIVO')
          .order('nombre_completo'),
        supabase
          .from('zonas')
          .select('id, nombre')
          .eq('estado', 'ACTIVO')
          .order('nombre'),
      ])
      setCollectors((cRes.data ?? []) as { id: string; nombre_completo: string }[])
      setZones((zRes.data ?? []) as { id: string; nombre: string }[])
      setLoading(false)
    }
    fetch()
  }, [])

  return { collectors, zones, loading }
}
