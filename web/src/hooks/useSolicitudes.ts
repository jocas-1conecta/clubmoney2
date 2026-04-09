import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Solicitud, SolicitudEstado, SolicitudFormData } from '@/types/solicitudes'
import type { Zona } from '@/types/clientes'

interface UseSolicitudesOptions {
  page?: number
  pageSize?: number
  search?: string
  estado?: string
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
}

interface CreateSolicitudPayload extends SolicitudFormData {
  asesor_id: string
}

interface UseSolicitudesReturn {
  solicitudes: Solicitud[]
  totalCount: number
  loading: boolean
  zonas: Zona[]
  refetch: () => void
  updateEstado: (id: string, estado: SolicitudEstado, motivo?: string) => Promise<{ error: string | null }>
  createSolicitud: (data: CreateSolicitudPayload) => Promise<{ id: string | null; error: string | null }>
}

export function useSolicitudes(options: UseSolicitudesOptions = {}): UseSolicitudesReturn {
  const {
    page = 1,
    pageSize = 15,
    search = '',
    estado = '',
    sortKey = 'created_at',
    sortDirection = 'desc',
  } = options

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [trigger, setTrigger] = useState(0)
  const [zonas, setZonas] = useState<Zona[]>([])

  // Load zonas once for client creation inline
  useEffect(() => {
    supabase
      .from('zonas')
      .select('id, nombre, descripcion, estado')
      .eq('estado', 'ACTIVA')
      .order('nombre')
      .then(({ data }) => { if (data) setZonas(data as Zona[]) })
  }, [])

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchData() {
      try {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
          .from('solicitudes_prestamo')
          .select(`
            *,
            cliente:clientes!solicitudes_prestamo_cliente_id_fkey(nombre_completo, dni, foto_url, telefono),
            asesor:perfiles!solicitudes_prestamo_asesor_id_fkey(nombre_completo)
          `, { count: 'exact' })

        // Filters
        if (estado) {
          query = query.eq('estado', estado)
        }
        if (search) {
          // Search by client name or DNI via joined table
          // Supabase doesn't support filtering on joined tables easily
          // so we search on the main table columns only
          query = query.or(`id.eq.${search}`)
        }

        query = query
          .order(sortKey, { ascending: sortDirection === 'asc' })
          .range(from, to)

        const { data, error, count } = await query

        if (cancelled) return

        if (error) {
          console.error('Error fetching solicitudes:', error)
          return
        }

        setSolicitudes((data ?? []) as unknown as Solicitud[])
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

  const updateEstado = useCallback(
    async (id: string, nuevoEstado: SolicitudEstado, motivo?: string) => {
      const update: Record<string, unknown> = { estado: nuevoEstado }
      if (motivo) update.motivo_rechazo = motivo

      const { error } = await supabase
        .from('solicitudes_prestamo')
        .update(update)
        .eq('id', id)

      if (!error) refetch()
      return { error: error?.message ?? null }
    },
    [refetch]
  )

  const createSolicitud = useCallback(
    async (data: CreateSolicitudPayload) => {
      const { data: inserted, error } = await supabase
        .from('solicitudes_prestamo')
        .insert({
          cliente_id: data.cliente_id,
          asesor_id: data.asesor_id,
          monto_solicitado: data.monto_solicitado,
          plazo_dias: data.plazo_dias,
          tasa_interes: data.tasa_interes,
          tipo_cronograma: data.tipo_cronograma,
          es_renovacion: data.es_renovacion ?? false,
          requiere_verificacion_campo: data.requiere_verificacion_campo ?? true,
          estado: 'INGRESADA',
        })
        .select('id')
        .single()

      if (!error && inserted) refetch()
      return { id: inserted?.id ?? null, error: error?.message ?? null }
    },
    [refetch]
  )

  return { solicitudes, totalCount, loading, zonas, refetch, updateEstado, createSolicitud }
}
