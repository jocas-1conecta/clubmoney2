import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { CasoMorosidad } from '@/types/morosidad'

interface UseMorosidadOptions {
  page?: number
  pageSize?: number
  categoria?: string
  estado?: string
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

interface MorosidadStats {
  totalCasos: number
  montoTotal: number
  temprana: number
  media: number
  grave: number
  prejuridico: number
}

export function useMorosidad(options: UseMorosidadOptions = {}) {
  const {
    page = 1,
    pageSize = 15,
    categoria = '',
    estado = '',
    sortKey = 'dias_sin_pago',
    sortDirection = 'desc',
  } = options

  const [casos, setCasos] = useState<CasoMorosidad[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<MorosidadStats>({
    totalCasos: 0,
    montoTotal: 0,
    temprana: 0,
    media: 0,
    grave: 0,
    prejuridico: 0,
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
          .from('casos_morosidad')
          .select(`
            *,
            cliente:clientes!casos_morosidad_cliente_id_fkey(nombre_completo, dni, foto_url, telefono),
            asignado:perfiles!casos_morosidad_asignado_a_fkey(nombre_completo),
            prestamo:prestamos!casos_morosidad_prestamo_id_fkey(monto_capital, saldo_pendiente, fecha_vencimiento)
          `, { count: 'exact' })

        if (categoria) query = query.eq('categoria_mora', categoria)
        if (estado) query = query.eq('estado', estado)

        query = query
          .order(sortKey, { ascending: sortDirection === 'asc' })
          .range(from, to)

        // Fetch cases + global stats in parallel
        const [casosResult, allCasosResult] = await Promise.all([
          query,
          supabase
            .from('casos_morosidad')
            .select('categoria_mora, monto_vencido, estado')
            .in('estado', ['ABIERTO', 'EN_GESTION', 'ESCALADO_CAMPO']),
        ])

        if (cancelled) return

        if (casosResult.error) {
          console.error('Error fetching morosidad:', casosResult.error)
          return
        }

        setCasos((casosResult.data ?? []) as unknown as CasoMorosidad[])
        setTotalCount(casosResult.count ?? 0)

        // Stats
        const all = allCasosResult.data ?? []
        setStats({
          totalCasos: all.length,
          montoTotal: all.reduce((s, c) => s + Number(c.monto_vencido), 0),
          temprana: all.filter((c) => c.categoria_mora === 'MORA_TEMPRANA').length,
          media: all.filter((c) => c.categoria_mora === 'MORA_MEDIA').length,
          grave: all.filter((c) => c.categoria_mora === 'MORA_GRAVE').length,
          prejuridico: all.filter((c) => c.categoria_mora === 'PREJURIDICO').length,
        })
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, pageSize, categoria, estado, sortKey, sortDirection, trigger])

  return { casos, totalCount, loading, stats, refetch }
}
