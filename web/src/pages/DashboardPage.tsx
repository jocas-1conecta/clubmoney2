import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Skeleton } from '@/components/ui'
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  UserPlus,
  CheckCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `S/ ${(n / 1_000).toFixed(1)}K`
  return fmt(n)
}

const timeSince = (d: string) => {
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (sec < 60) return 'Hace un momento'
  if (sec < 3600) return `Hace ${Math.floor(sec / 60)} min`
  if (sec < 86400) return `Hace ${Math.floor(sec / 3600)}h`
  return `Hace ${Math.floor(sec / 86400)}d`
}

/* ── Chart skeleton placeholder ── */
function ChartSkeleton({ height = '220px' }: { height?: string }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Skeleton width="200px" height="16px" />
        <Skeleton width="140px" height="12px" style={{ marginTop: '8px' }} />
      </div>
    </div>
  )
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border-2)',
      borderRadius: 'var(--radius-sm)',
      padding: 'var(--sp-2) var(--sp-3)',
      fontSize: 'var(--fs-xs)',
      boxShadow: 'var(--shadow-elevated)',
    }}>
      <div style={{ color: 'var(--color-text-3)', marginBottom: '2px', fontWeight: 600 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 'var(--sp-2)', justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {typeof p.value === 'number' && p.name !== 'Meta' ? fmtShort(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { profile, roles } = useAuth()
  const navigate = useNavigate()
  const { stats, recentActivity, weeklyRecaudacion, carteraComposicion, originacionMensual, loading } = useDashboardStats()

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = profile?.nombre_completo?.split(' ')[0] ?? 'Administrador'

  const statCards = [
    {
      label: 'Clientes Activos',
      value: loading ? null : String(stats.clientesActivos),
      icon: Users,
      iconBg: 'rgba(0, 229, 160, 0.12)',
      iconColor: '#00E5A0',
      accent: 'green',
      subtext: `+${stats.clientesNuevosMes} este mes`,
    },
    {
      label: 'Cartera Activa',
      value: loading ? null : fmtShort(stats.saldoCartera),
      icon: Wallet,
      iconBg: 'rgba(91, 141, 239, 0.12)',
      iconColor: '#5B8DEF',
      accent: 'blue',
      subtext: `${stats.prestamosActivos} préstamos activos`,
    },
    {
      label: 'Recaudación Hoy',
      value: loading ? null : fmtShort(stats.recaudacionHoy),
      icon: TrendingUp,
      iconBg: 'rgba(255, 181, 71, 0.12)',
      iconColor: '#FFB547',
      accent: 'amber',
      subtext: `${stats.cobranzaHoy} pagos recibidos`,
    },
    {
      label: 'Casos en Mora',
      value: loading ? null : String(stats.casosEnMora),
      icon: AlertTriangle,
      iconBg: 'rgba(255, 92, 92, 0.12)',
      iconColor: '#FF5C5C',
      accent: 'red',
      subtext: `${stats.solicitudesPendientes} solicitudes pendientes`,
    },
  ]

  const quickActions = [
    { label: 'Registrar Cliente', icon: UserPlus, path: '/clientes' },
    { label: 'Nueva Solicitud', icon: FileText, path: '/solicitudes' },
    { label: 'Registrar Pago', icon: DollarSign, path: '/cobranza' },
    { label: 'Ver Reportes', icon: BarChart3, path: '/configuracion' },
  ]

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* ═══ HEADER ═══ */}
      <div className="animate-in" style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-2xl)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--color-text-1)',
        }}>
          {greeting},{' '}
          <span className="text-gradient">{firstName}</span>
        </h1>
        <p style={{
          marginTop: '2px',
          fontSize: 'var(--fs-sm)',
          color: 'var(--color-text-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
        }}>
          <Clock size={12} />
          {dateStr}
        </p>
      </div>

      {/* ═══ STATS GRID ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--sp-3)',
        marginBottom: 'var(--sp-5)',
      }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`stat-card accent-${stat.accent} animate-in delay-${i + 1}`}
              style={{ padding: 'var(--sp-4)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
                <div style={{
                  width: '38px', height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: stat.iconBg,
                }}>
                  <Icon size={20} style={{ color: stat.iconColor }} />
                </div>
              </div>
              {stat.value === null ? (
                <>
                  <Skeleton width="100px" height="24px" />
                  <Skeleton width="80px" height="11px" style={{ marginTop: '6px' }} />
                </>
              ) : (
                <>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-xl)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-text-1)',
                    marginBottom: '2px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-3)',
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--color-text-3)',
                    marginTop: 'var(--sp-1)',
                    opacity: 0.7,
                  }}>
                    {stat.subtext}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--sp-3)',
        marginBottom: 'var(--sp-5)',
      }} className="lg:!grid-cols-[2fr_1fr]">

        {/* Recaudación Semanal — Area Chart */}
        <div className="glass-card animate-in delay-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--sp-4)',
            borderBottom: '1px solid var(--color-border-1)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)' }}>
              Recaudación Semanal
            </h2>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '2px' }}>
              Comparativa vs meta diaria
            </p>
          </div>
          <div style={{ padding: 'var(--sp-4) var(--sp-3) var(--sp-2)', height: '220px' }}>
            {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyRecaudacion} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRecaudado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#556688', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#556688', fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="recaudado"
                  name="Recaudado"
                  stroke="#00E5A0"
                  fill="url(#fillRecaudado)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="meta"
                  name="Meta"
                  stroke="#5B8DEF"
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Composición de Cartera — Pie Chart */}
        <div className="glass-card animate-in delay-4" style={{ padding: 'var(--sp-4)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-3)' }}>
            Composición de Cartera
          </h2>
          {loading ? <ChartSkeleton height="160px" /> : (
          <>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={carteraComposicion}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {carteraComposicion.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, '']}
                  contentStyle={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--fs-xs)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            {carteraComposicion.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>{item.name}</span>
                <span style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', marginLeft: 'auto', fontWeight: 600 }}>{item.value}%</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      </div>

      {/* ═══ ORIGINACIÓN + ACTIVITY ROW ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--sp-3)',
      }} className="lg:!grid-cols-[1fr_1fr_auto]">

        {/* Originación Mensual — Bar Chart */}
        <div className="glass-card animate-in delay-5" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--sp-4)',
            borderBottom: '1px solid var(--color-border-1)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)' }}>
              Originación
            </h2>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '2px' }}>
              Solicitudes vs Aprobadas
            </p>
          </div>
          <div style={{ padding: 'var(--sp-4) var(--sp-3) var(--sp-2)', height: '200px' }}>
            {loading ? <ChartSkeleton height="200px" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={originacionMensual} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#556688', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#556688', fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="solicitudes" name="Solicitudes" fill="#5B8DEF" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="aprobadas" name="Aprobadas" fill="#00E5A0" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="glass-card animate-in delay-5" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--sp-4)',
            borderBottom: '1px solid var(--color-border-1)',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)' }}>
                Actividad Reciente
              </h2>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '2px' }}>
                Últimas operaciones
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                  <Skeleton width="32px" height="32px" rounded="md" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height="13px" />
                    <Skeleton width="40%" height="11px" style={{ marginTop: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
              <CheckCircle size={28} style={{ color: 'var(--color-text-3)', margin: '0 auto var(--sp-3)' }} />
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
                No hay actividad reciente
              </p>
            </div>
          ) : (
            recentActivity.map((item, i) => (
              <div
                key={item.id}
                className="activity-row"
                style={{
                  borderBottom: i < recentActivity.length - 1 ? '1px solid var(--color-border-1)' : 'none',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: 'rgba(0, 229, 160, 0.1)',
                }}>
                  <DollarSign size={14} style={{ color: '#00E5A0' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--fs-base)', fontWeight: 500, color: 'var(--color-text-1)' }}>
                    {item.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {item.amount !== undefined && (
                    <p style={{ fontSize: 'var(--fs-base)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}>
                      {fmt(item.amount)}
                    </p>
                  )}
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>
                    {timeSince(item.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', minWidth: '220px' }}>
          {/* Quick Actions */}
          <div className="glass-card animate-in delay-5" style={{ padding: 'var(--sp-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-3)' }}>
              Acciones Rápidas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    className="action-btn"
                    onClick={() => navigate(action.path)}
                  >
                    <Icon size={16} />
                    <span>{action.label}</span>
                    <ArrowUpRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Session */}
          <div className="glass-card animate-in delay-5" style={{ padding: 'var(--sp-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-3)' }}>
              Tu Sesión
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>Nombre</span>
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--color-text-1)' }}>
                  {profile?.nombre_completo ?? '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>Rol</span>
                <span style={{
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}>
                  {roles[0] ?? '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>Estado</span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-1)',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 500,
                  color: 'var(--color-success)',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 8px rgba(0, 229, 160, 0.5)' }} />
                  {profile?.estado ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
