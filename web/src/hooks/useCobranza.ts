import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Pago } from '@/types/cobranza'

interface UseCobranzaOptions {
  page?: number
  pageSize?: number
  medioPago?: string
  estado?: string
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

interface CobranzaStats {
  totalRecaudadoHoy: number
  pagosHoy: number
  pendientesConciliacion: number
  efectivo: number
  digital: number
}

export function useCobranza(options: UseCobranzaOptions = {}) {
  const {
    page = 1,
    pageSize = 15,
    medioPago = '',
    estado = '',
    sortKey = 'fecha_pago',
    sortDirection = 'desc',
  } = options

  const [pagos, setPagos] = useState<Pago[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CobranzaStats>({
    totalRecaudadoHoy: 0,
    pagosHoy: 0,
    pendientesConciliacion: 0,
    efectivo: 0,
    digital: 0,
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
          .from('pagos')
          .select(`
            *,
            cliente:clientes!pagos_cliente_id_fkey(nombre_completo, dni, foto_url),
            cobrador:perfiles!pagos_cobrador_id_fkey(nombre_completo)
          `, { count: 'exact' })

        if (medioPago) query = query.eq('medio_pago', medioPago)
        if (estado) query = query.eq('estado', estado)

        query = query
          .order(sortKey, { ascending: sortDirection === 'asc' })
          .range(from, to)

        // Fetch pagos + today's stats in parallel
        const today = new Date().toISOString().split('T')[0]

        const [pagosResult, statsResult] = await Promise.all([
          query,
          supabase
            .from('pagos')
            .select('monto, medio_pago, estado')
            .gte('fecha_pago', `${today}T00:00:00`)
            .lte('fecha_pago', `${today}T23:59:59`)
            .not('estado', 'in', '("ANULADO","EXTORNADO")'),
        ])

        if (cancelled) return

        if (pagosResult.error) {
          console.error('Error fetching pagos:', pagosResult.error)
          return
        }

        setPagos((pagosResult.data ?? []) as unknown as Pago[])
        setTotalCount(pagosResult.count ?? 0)

        // Stats
        const todayPagos = statsResult.data ?? []
        const totalHoy = todayPagos.reduce((s, p) => s + Number(p.monto), 0)
        const efectivo = todayPagos
          .filter((p) => p.medio_pago === 'EFECTIVO')
          .reduce((s, p) => s + Number(p.monto), 0)
        const digital = totalHoy - efectivo
        const pendientes = todayPagos.filter(
          (p) => p.estado === 'PENDIENTE_CONCILIACION' || p.estado === 'RECAUDADO_EN_CAMPO'
        ).length

        setStats({
          totalRecaudadoHoy: totalHoy,
          pagosHoy: todayPagos.length,
          pendientesConciliacion: pendientes,
          efectivo,
          digital,
        })
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, pageSize, medioPago, estado, sortKey, sortDirection, trigger])

  return { pagos, totalCount, loading, stats, refetch }
}
