import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'

/* ── Interfaces ── */

export interface DashboardStats {
  clientesActivos: number
  prestamosActivos: number
  saldoCartera: number
  recaudacionHoy: number
  solicitudesPendientes: number
  casosEnMora: number
  clientesNuevosMes: number
  cobranzaHoy: number
}

interface RecentActivity {
  id: string
  type: 'pago' | 'cliente' | 'prestamo' | 'solicitud'
  description: string
  amount?: number
  timestamp: string
}

/** Recaudación diaria para gráfico semanal (AreaChart) */
export interface WeeklyRecaudacion {
  day: string
  recaudado: number
  meta: number
}

/** Composición de cartera para gráfico de dona (PieChart) */
export interface CarteraComposicion {
  name: string
  value: number
  color: string
}

/** Originación mensual para gráfico de barras (BarChart) */
export interface OriginacionMensual {
  mes: string
  solicitudes: number
  aprobadas: number
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  weeklyRecaudacion: WeeklyRecaudacion[]
  carteraComposicion: CarteraComposicion[]
  originacionMensual: OriginacionMensual[]
  loading: boolean
  error: string | null
}

/* ── Helpers ── */

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const CARTERA_COLORS: Record<string, { label: string; color: string }> = {
  ACTIVO: { label: 'Vigente', color: '#00E5A0' },
  EN_MORA: { label: 'En Mora', color: '#FFB547' },
  VENCIDO: { label: 'Vencido', color: '#FF5C5C' },
  CANCELADO: { label: 'Cancelado', color: '#5B8DEF' },
  PENDIENTE_DESEMBOLSO: { label: 'Pend. Desembolso', color: '#A78BFA' },
  CANCELADO_POR_REFINANCIACION: { label: 'Refinanciado', color: '#6EE7B7' },
}

/** Returns ISO date string for N days ago */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

/** Returns ISO date string for start of month, N months ago */
function monthsAgoStart(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n, 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/* ── Hook ── */

export function useDashboardStats(): DashboardData {
  const [stats, setStats] = useState<DashboardStats>({
    clientesActivos: 0,
    prestamosActivos: 0,
    saldoCartera: 0,
    recaudacionHoy: 0,
    solicitudesPendientes: 0,
    casosEnMora: 0,
    clientesNuevosMes: 0,
    cobranzaHoy: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [weeklyRecaudacion, setWeeklyRecaudacion] = useState<WeeklyRecaudacion[]>([])
  const [carteraComposicion, setCarteraComposicion] = useState<CarteraComposicion[]>([])
  const [originacionMensual, setOriginacionMensual] = useState<OriginacionMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchDashboard() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        const weekAgo = daysAgo(6) // 7 days including today
        const threeMonthsAgo = monthsAgoStart(2) // current + 2 previous months

        const [
          clientesRes,
          prestamosRes,
          pagosHoyRes,
          solicitudesRes,
          morosidadRes,
          clientesMesRes,
          actividadRes,
          // ── NEW: Chart queries ──
          pagosSemanaRes,
          prestamosEstadoRes,
          solicitudesTrimRes,
        ] = await Promise.all([
          // ── Existing stats queries ──
          supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'ACTIVO'),
          supabase.from('prestamos').select('saldo_pendiente').eq('estado', 'ACTIVO'),
          supabase.from('pagos').select('monto').gte('fecha_pago', today).not('estado', 'in', '("ANULADO","EXTORNADO")'),
          supabase.from('solicitudes_prestamo').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
          supabase.from('casos_morosidad').select('id', { count: 'exact', head: true }).eq('estado', 'EN_GESTION'),
          supabase.from('clientes').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
          supabase.from('pagos')
            .select('id, monto, fecha_pago, medio_pago')
            .not('estado', 'in', '("ANULADO","EXTORNADO")')
            .order('fecha_pago', { ascending: false })
            .limit(5),

          // ── NEW: Weekly recaudación (last 7 days) ──
          supabase.from('pagos')
            .select('monto, fecha_pago')
            .gte('fecha_pago', weekAgo)
            .not('estado', 'in', '("ANULADO","EXTORNADO")'),

          // ── NEW: Cartera composición (all prestamos by estado) ──
          supabase.from('prestamos')
            .select('estado'),

          // ── NEW: Originación trimestral (last 3 months) ──
          supabase.from('solicitudes_prestamo')
            .select('estado, created_at')
            .gte('created_at', threeMonthsAgo),
        ])

        if (cancelled) return

        // ── Calculate existing stats ──
        const saldoCartera = (prestamosRes.data ?? []).reduce(
          (sum, p) => sum + ((p as { saldo_pendiente: number }).saldo_pendiente ?? 0),
          0
        )
        const recaudacionHoy = (pagosHoyRes.data ?? []).reduce(
          (sum, p) => sum + ((p as { monto: number }).monto ?? 0),
          0
        )

        setStats({
          clientesActivos: clientesRes.count ?? 0,
          prestamosActivos: prestamosRes.data?.length ?? 0,
          saldoCartera,
          recaudacionHoy,
          solicitudesPendientes: solicitudesRes.count ?? 0,
          casosEnMora: morosidadRes.count ?? 0,
          clientesNuevosMes: clientesMesRes.count ?? 0,
          cobranzaHoy: (pagosHoyRes.data ?? []).length,
        })

        // ── Recent activity ──
        const activity: RecentActivity[] = ((actividadRes.data ?? []) as { id: string; monto: number; fecha_pago: string; medio_pago: string }[]).map((p) => ({
          id: p.id,
          type: 'pago' as const,
          description: `Pago recibido (${p.medio_pago.replace(/_/g, ' ')})`,
          amount: p.monto,
          timestamp: p.fecha_pago,
        }))
        setRecentActivity(activity)

        // ── NEW: Process weekly recaudación ──
        const weeklyMap = new Map<string, number>()
        // Initialize all 7 days with 0
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          weeklyMap.set(d.toISOString().split('T')[0], 0)
        }
        // Sum payments by day
        for (const row of (pagosSemanaRes.data ?? []) as { monto: number; fecha_pago: string }[]) {
          const dayKey = row.fecha_pago.split('T')[0]
          if (weeklyMap.has(dayKey)) {
            weeklyMap.set(dayKey, (weeklyMap.get(dayKey) ?? 0) + row.monto)
          }
        }
        // Convert to chart data
        const weeklyData: WeeklyRecaudacion[] = []
        // Calculate dynamic meta (average of non-zero days or fallback)
        const weeklyValues = Array.from(weeklyMap.values())
        const nonZeroDays = weeklyValues.filter(v => v > 0)
        const metaDiaria = nonZeroDays.length > 0
          ? Math.round(nonZeroDays.reduce((a, b) => a + b, 0) / nonZeroDays.length)
          : 2500
        for (const [dateStr, total] of weeklyMap) {
          const dayIndex = new Date(dateStr + 'T12:00:00').getDay()
          weeklyData.push({
            day: DAY_NAMES[dayIndex],
            recaudado: Math.round(total * 100) / 100,
            meta: metaDiaria,
          })
        }
        setWeeklyRecaudacion(weeklyData)

        // ── NEW: Process cartera composición ──
        const estadoCount = new Map<string, number>()
        for (const row of (prestamosEstadoRes.data ?? []) as { estado: string }[]) {
          estadoCount.set(row.estado, (estadoCount.get(row.estado) ?? 0) + 1)
        }
        const totalPrestamos = (prestamosEstadoRes.data ?? []).length
        const carteraData: CarteraComposicion[] = []
        for (const [estado, count] of estadoCount) {
          const config = CARTERA_COLORS[estado] ?? { label: estado, color: '#8B9DC3' }
          carteraData.push({
            name: config.label,
            value: totalPrestamos > 0 ? Math.round((count / totalPrestamos) * 100) : 0,
            color: config.color,
          })
        }
        // Sort by value descending for better chart readability
        carteraData.sort((a, b) => b.value - a.value)
        setCarteraComposicion(carteraData.length > 0 ? carteraData : [
          { name: 'Sin datos', value: 100, color: '#2A3352' },
        ])

        // ── NEW: Process originación mensual ──
        const monthMap = new Map<string, { solicitudes: number; aprobadas: number }>()
        // Initialize last 3 months
        for (let i = 2; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthMap.set(key, { solicitudes: 0, aprobadas: 0 })
        }
        // Count solicitudes by month
        for (const row of (solicitudesTrimRes.data ?? []) as { estado: string; created_at: string }[]) {
          const d = new Date(row.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const entry = monthMap.get(key)
          if (entry) {
            entry.solicitudes++
            if (row.estado === 'APROBADA' || row.estado === 'EN_FORMALIZACION') {
              entry.aprobadas++
            }
          }
        }
        const originData: OriginacionMensual[] = []
        for (const [key, val] of monthMap) {
          const monthIdx = parseInt(key.split('-')[1], 10) - 1
          originData.push({
            mes: MONTH_NAMES[monthIdx],
            solicitudes: val.solicitudes,
            aprobadas: val.aprobadas,
          })
        }
        setOriginacionMensual(originData)

      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDashboard()
    return () => { cancelled = true }
  }, [])

  return { stats, recentActivity, weeklyRecaudacion, carteraComposicion, originacionMensual, loading, error }
}
