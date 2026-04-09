import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Prestamo } from '@/types/prestamos'

interface UsePrestamosOptions {
  page?: number
  pageSize?: number
  search?: string
  estado?: string
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

interface UsePrestamosReturn {
  prestamos: Prestamo[]
  totalCount: number
  loading: boolean
  refetch: () => void
}

export function usePrestamos(options: UsePrestamosOptions = {}): UsePrestamosReturn {
  const {
    page = 1,
    pageSize = 15,
    search = '',
    estado = '',
    sortKey = 'created_at',
    sortDirection = 'desc',
  } = options

  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
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
          .from('prestamos')
          .select(`
            *,
            cliente:clientes!prestamos_cliente_id_fkey(nombre_completo, dni, foto_url),
            asesor:perfiles!prestamos_asesor_id_fkey(nombre_completo),
            zona:zonas!prestamos_zona_id_fkey(nombre)
          `, { count: 'exact' })

        if (estado) {
          query = query.eq('estado', estado)
        }

        query = query
          .order(sortKey, { ascending: sortDirection === 'asc' })
          .range(from, to)

        const { data, error, count } = await query

        if (cancelled) return

        if (error) {
          console.error('Error fetching prestamos:', error)
          return
        }

        setPrestamos((data ?? []) as unknown as Prestamo[])
        setTotalCount(count ?? 0)
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, pageSize, search, estado, sortKey, sortDirection, trigger])

  return { prestamos, totalCount, loading, refetch }
}
