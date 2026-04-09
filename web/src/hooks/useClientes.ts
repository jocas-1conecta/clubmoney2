import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Cliente, ClienteFormData, Zona } from '@/types/clientes'

interface UseClientesOptions {
  page?: number
  pageSize?: number
  search?: string
  estado?: string
  zonaId?: string
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

interface UseClientesReturn {
  clientes: Cliente[]
  totalCount: number
  loading: boolean
  error: string | null
  zonas: Zona[]
  refetch: () => void
  createCliente: (data: ClienteFormData) => Promise<{ error: string | null }>
  updateCliente: (id: string, data: Partial<ClienteFormData>) => Promise<{ error: string | null }>
}

export function useClientes(options: UseClientesOptions = {}): UseClientesReturn {
  const {
    page = 1,
    pageSize = 15,
    search = '',
    estado = '',
    zonaId = '',
    sortKey = 'created_at',
    sortDirection = 'desc',
  } = options

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  // Load zonas once
  useEffect(() => {
    supabase
      .from('zonas')
      .select('id, nombre, descripcion, estado')
      .eq('estado', 'ACTIVA')
      .order('nombre')
      .then(({ data }) => {
        if (data) setZonas(data as Zona[])
      })
  }, [])

  // Fetch clientes with pagination
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchClientes() {
      try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
          .from('clientes')
          .select(
            `
            *,
            zona:zonas(id, nombre),
            registrador:perfiles!clientes_registrado_por_fkey(nombre_completo)
            `,
            { count: 'exact' }
          )
          .range(from, to)
          .order(sortKey, { ascending: sortDirection === 'asc' })

        // Filters
        if (search.trim()) {
          query = query.or(
            `nombre_completo.ilike.%${search}%,dni.ilike.%${search}%,telefono.ilike.%${search}%`
          )
        }
        if (estado) {
          query = query.eq('estado', estado)
        }
        if (zonaId) {
          query = query.eq('zona_id', zonaId)
        }

        const { data, count, error: fetchError } = await query

        if (cancelled) return

        if (fetchError) {
          setError(fetchError.message)
          setClientes([])
          setTotalCount(0)
        } else {
          setClientes((data ?? []) as unknown as Cliente[])
          setTotalCount(count ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClientes()
    return () => { cancelled = true }
  }, [page, pageSize, search, estado, zonaId, sortKey, sortDirection, trigger])

  const createCliente = useCallback(async (data: ClienteFormData) => {
    const { error: insertError } = await supabase
      .from('clientes')
      .insert(data)
    if (insertError) return { error: insertError.message }
    refetch()
    return { error: null }
  }, [refetch])

  const updateCliente = useCallback(async (id: string, data: Partial<ClienteFormData>) => {
    const { error: updateError } = await supabase
      .from('clientes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) return { error: updateError.message }
    refetch()
    return { error: null }
  }, [refetch])

  return {
    clientes,
    totalCount,
    loading,
    error,
    zonas,
    refetch,
    createCliente,
    updateCliente,
  }
}
