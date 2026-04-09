import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Cliente } from '@/types/clientes'

interface PrestamoResumen {
  id: string
  monto_capital: number
  monto_total_pagar: number
  saldo_pendiente: number
  tasa_interes: number
  plazo_dias: number
  tipo_cronograma: string
  fecha_desembolso: string | null
  fecha_vencimiento: string
  estado: string
  created_at: string
}

interface PagoResumen {
  id: string
  monto: number
  medio_pago: string
  fecha_pago: string
  estado: string
  cobrador?: { nombre_completo: string } | null
  prestamo?: { monto_total_pagar: number } | null
}

interface VisitaResumen {
  id: string
  tipo_visita: string
  estado_visita: string
  fecha_programada: string | null
  fecha_ejecutada: string | null
  notas: string | null
  verificador?: { nombre_completo: string } | null
}

export interface ClienteDetalle extends Cliente {
  prestamos: PrestamoResumen[]
  pagos: PagoResumen[]
  visitas: VisitaResumen[]
}

interface UseClienteDetalleReturn {
  cliente: ClienteDetalle | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useClienteDetalle(id: string | undefined): UseClienteDetalleReturn {
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('ID de cliente no proporcionado')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchDetalle() {
      try {
        const [clienteRes, prestamosRes, pagosRes, visitasRes] = await Promise.all([
          // Cliente with joined zone & registrador
          supabase
            .from('clientes')
            .select(`
              *,
              zona:zonas(id, nombre),
              registrador:perfiles!clientes_registrado_por_fkey(nombre_completo)
            `)
            .eq('id', id)
            .single(),

          // Préstamos del cliente
          supabase
            .from('prestamos')
            .select('id, monto_capital, monto_total_pagar, saldo_pendiente, tasa_interes, plazo_dias, tipo_cronograma, fecha_desembolso, fecha_vencimiento, estado, created_at')
            .eq('cliente_id', id)
            .order('created_at', { ascending: false }),

          // Pagos del cliente
          supabase
            .from('pagos')
            .select(`
              id, monto, medio_pago, fecha_pago, estado,
              cobrador:perfiles!pagos_cobrador_id_fkey(nombre_completo),
              prestamo:prestamos!pagos_prestamo_id_fkey(monto_total_pagar)
            `)
            .eq('cliente_id', id)
            .order('fecha_pago', { ascending: false })
            .limit(50),

          // Visitas del cliente
          supabase
            .from('visitas_presenciales')
            .select(`
              id, tipo_visita, estado_visita, fecha_programada, fecha_ejecutada, notas,
              verificador:perfiles!visitas_presenciales_verificador_id_fkey(nombre_completo)
            `)
            .eq('cliente_id', id)
            .order('created_at', { ascending: false })
            .limit(30),
        ])

        if (cancelled) return

        if (clienteRes.error) {
          setError(clienteRes.error.message)
          return
        }

        const clienteData = clienteRes.data as unknown as Cliente
        const detalle: ClienteDetalle = {
          ...clienteData,
          prestamos: (prestamosRes.data ?? []) as unknown as PrestamoResumen[],
          pagos: (pagosRes.data ?? []) as unknown as PagoResumen[],
          visitas: (visitasRes.data ?? []) as unknown as VisitaResumen[],
        }

        setCliente(detalle)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDetalle()
    return () => { cancelled = true }
  }, [id, trigger])

  return { cliente, loading, error, refetch }
}
