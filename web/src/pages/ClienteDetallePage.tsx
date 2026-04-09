import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Calendar,
  Wallet,
  TrendingUp,
  Eye,
  DollarSign,
  Clock,
  Edit,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react'
import {
  Breadcrumb,
  Badge,
  statusVariant,
  Button,
  Tabs,
  Avatar,
  Skeleton,
} from '@/components/ui'
import { useClienteDetalle } from '@/hooks/useClienteDetalle'

// ─── Currency formatter ──────────────────────────────────────────
const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateFmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

const dateTimeFmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cliente, loading, error, refetch } = useClienteDetalle(id)

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !cliente) {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: 'var(--sp-6) 0' }}>
        <div className="glass-card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <XCircle size={40} style={{ color: 'var(--color-danger)', margin: '0 auto var(--sp-4)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-2)' }}>
            Cliente no encontrado
          </h2>
          <p style={{ color: 'var(--color-text-3)', marginBottom: 'var(--sp-6)' }}>
            {error ?? 'No se pudo cargar la información del cliente.'}
          </p>
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/clientes')}>
            Volver a Clientes
          </Button>
        </div>
      </div>
    )
  }

  // Stats
  const prestamosActivos = cliente.prestamos.filter((p) => p.estado === 'ACTIVO').length
  const saldoTotal = cliente.prestamos
    .filter((p) => ['ACTIVO', 'VENCIDO', 'EN_MORA'].includes(p.estado))
    .reduce((sum, p) => sum + p.saldo_pendiente, 0)
  const totalPagado = cliente.pagos
    .filter((p) => p.estado !== 'ANULADO' && p.estado !== 'EXTORNADO')
    .reduce((sum, p) => sum + p.monto, 0)

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="animate-in">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Clientes', href: '/clientes' },
          { label: cliente.nombre_completo },
        ]}
      />

      {/* ═══ HEADER ═══ */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--sp-5)',
          marginTop: 'var(--sp-4)',
          marginBottom: 'var(--sp-5)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--sp-5)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Avatar name={cliente.nombre_completo} src={cliente.foto_url} size="lg" />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-1)' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text-1)' }}>
                {cliente.nombre_completo}
              </h1>
              <Badge variant={statusVariant(cliente.estado)} dot>
                {cliente.estado}
              </Badge>
              {cliente.es_cliente_recurrente && (
                <Badge variant="accent">
                  <Star size={10} /> Recurrente
                </Badge>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)', fontSize: 'var(--fs-base)', color: 'var(--color-text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                <IdCard size={13} /> {cliente.dni}
              </span>
              {cliente.telefono && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                  <Phone size={13} /> {cliente.telefono}
                </span>
              )}
              {cliente.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                  <Mail size={13} /> {cliente.email}
                </span>
              )}
              {cliente.zona?.nombre && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                  <MapPin size={13} /> {cliente.zona.nombre}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                <Calendar size={13} /> Registrado {dateFmt(cliente.created_at)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignSelf: 'flex-start' }}>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch} />
            <Button variant="outline" size="sm" icon={<Edit size={14} />}>
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}
      >
        <MiniStat
          icon={<Wallet size={20} />}
          iconBg="rgba(91, 141, 239, 0.12)"
          iconColor="#5B8DEF"
          label="Préstamos Activos"
          value={String(prestamosActivos)}
        />
        <MiniStat
          icon={<AlertTriangle size={20} />}
          iconBg="rgba(255, 181, 71, 0.12)"
          iconColor="#FFB547"
          label="Saldo Pendiente"
          value={fmt(saldoTotal)}
        />
        <MiniStat
          icon={<TrendingUp size={20} />}
          iconBg="rgba(0, 229, 160, 0.12)"
          iconColor="#00E5A0"
          label="Total Pagado"
          value={fmt(totalPagado)}
        />
        <MiniStat
          icon={<Eye size={20} />}
          iconBg="rgba(139, 157, 195, 0.12)"
          iconColor="#8B9DC3"
          label="Visitas"
          value={String(cliente.visitas.length)}
        />
      </div>

      {/* ═══ TABS CONTENT ═══ */}
      <Tabs
        tabs={[
          { id: 'info', label: 'Información', icon: <IdCard size={14} /> },
          { id: 'prestamos', label: 'Préstamos', icon: <Wallet size={14} />, badge: cliente.prestamos.length },
          { id: 'pagos', label: 'Pagos', icon: <DollarSign size={14} />, badge: cliente.pagos.length },
          { id: 'visitas', label: 'Visitas', icon: <Eye size={14} />, badge: cliente.visitas.length },
        ]}
      >
        {(tab) => {
          if (tab === 'info') return <InfoTab cliente={cliente} />
          if (tab === 'prestamos') return <PrestamosTab prestamos={cliente.prestamos} />
          if (tab === 'pagos') return <PagosTab pagos={cliente.pagos} />
          if (tab === 'visitas') return <VisitasTab visitas={cliente.visitas} />
          return null
        }}
      </Tabs>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

function MiniStat({ icon, iconBg, iconColor, label, value }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string
}) {
  return (
    <div className="glass-card" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
      <div
        style={{
          width: '40px', height: '40px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: iconBg, color: iconColor, flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>
          {value}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function InfoTab({ cliente }: { cliente: ClienteDetallePage_Cliente }) {
  const items = [
    { label: 'DNI', value: cliente.dni, icon: <IdCard size={14} /> },
    { label: 'Teléfono', value: cliente.telefono, icon: <Phone size={14} /> },
    { label: 'Teléfono Secundario', value: cliente.telefono_secundario, icon: <Phone size={14} /> },
    { label: 'Email', value: cliente.email, icon: <Mail size={14} /> },
    { label: 'Dirección', value: cliente.direccion, icon: <MapPin size={14} /> },
    { label: 'Referencia', value: cliente.referencia_direccion, icon: <MapPin size={14} /> },
    { label: 'Zona', value: cliente.zona?.nombre, icon: <MapPin size={14} /> },
    { label: 'Calificación', value: cliente.calificacion_interna, icon: <Star size={14} /> },
    { label: 'Registrado por', value: cliente.registrador?.nombre_completo, icon: <UserCheck size={14} /> },
    { label: 'Fecha de Registro', value: dateFmt(cliente.created_at), icon: <Calendar size={14} /> },
    { label: 'Última Actualización', value: dateFmt(cliente.updated_at), icon: <Clock size={14} /> },
  ]

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderBottom: i < items.length - 1 ? '1px solid var(--color-border-1)' : 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-3)' }}>
            {item.icon} {item.label}
          </span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: item.value ? 'var(--color-text-1)' : 'var(--color-text-3)' }}>
            {item.label === 'Calificación' && item.value ? (
              <Badge variant={statusVariant(item.value)}>{item.value}</Badge>
            ) : (
              item.value ?? '—'
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

// Type alias to avoid importing the full detalle type
type ClienteDetallePage_Cliente = ReturnType<typeof useClienteDetalle>['cliente'] & object

function PrestamosTab({ prestamos }: { prestamos: { id: string; monto_capital: number; monto_total_pagar: number; saldo_pendiente: number; tasa_interes: number; plazo_dias: number; tipo_cronograma: string; fecha_desembolso: string | null; fecha_vencimiento: string; estado: string; created_at: string }[] }) {
  if (prestamos.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <Wallet size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto 0.75rem' }} />
        <p style={{ color: 'var(--color-text-3)', fontSize: '0.875rem' }}>Este cliente no tiene préstamos registrados.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {prestamos.map((p) => (
        <div key={p.id} className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-1)' }}>
                  {fmt(p.monto_capital)}
                </span>
                <Badge variant={statusVariant(p.estado)} dot>{p.estado}</Badge>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginTop: '2px' }}>
                {p.tipo_cronograma} · {p.plazo_dias} días · {p.tasa_interes}% interés
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo Pendiente</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: p.saldo_pendiente > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {fmt(p.saldo_pendiente)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', color: 'var(--color-text-3)', flexWrap: 'wrap' }}>
            <span>Total a pagar: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>{fmt(p.monto_total_pagar)}</span></span>
            <span>Desembolso: {dateFmt(p.fecha_desembolso)}</span>
            <span>Vencimiento: {dateFmt(p.fecha_vencimiento)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PagosTab({ pagos }: { pagos: { id: string; monto: number; medio_pago: string; fecha_pago: string; estado: string; cobrador?: { nombre_completo: string } | null }[] }) {
  if (pagos.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <DollarSign size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto 0.75rem' }} />
        <p style={{ color: 'var(--color-text-3)', fontSize: '0.875rem' }}>Este cliente no tiene pagos registrados.</p>
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
      {pagos.map((p, i) => {
        const isAnulado = p.estado === 'ANULADO' || p.estado === 'EXTORNADO'
        return (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.875rem 1.25rem',
              borderBottom: i < pagos.length - 1 ? '1px solid var(--color-border-1)' : 'none',
              opacity: isAnulado ? 0.5 : 1,
            }}
          >
            <div
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                backgroundColor: isAnulado ? 'rgba(255, 92, 92, 0.1)' : 'rgba(0, 229, 160, 0.1)',
              }}
            >
              {isAnulado ? <XCircle size={16} style={{ color: '#FF5C5C' }} /> : <CheckCircle size={16} style={{ color: '#00E5A0' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-1)' }}>
                  {fmt(p.monto)}
                </span>
                <Badge variant={statusVariant(p.estado)}>{p.estado}</Badge>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                {p.medio_pago.replace(/_/g, ' ')}
                {p.cobrador?.nombre_completo ? ` · ${p.cobrador.nombre_completo}` : ''}
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {dateTimeFmt(p.fecha_pago)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function VisitasTab({ visitas }: { visitas: { id: string; tipo_visita: string; estado_visita: string; fecha_programada: string | null; fecha_ejecutada: string | null; notas: string | null; verificador?: { nombre_completo: string } | null }[] }) {
  if (visitas.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <Eye size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto 0.75rem' }} />
        <p style={{ color: 'var(--color-text-3)', fontSize: '0.875rem' }}>Este cliente no tiene visitas registradas.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {visitas.map((v) => (
        <div key={v.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant={statusVariant(v.tipo_visita)}>{v.tipo_visita.replace(/_/g, ' ')}</Badge>
              <Badge variant={statusVariant(v.estado_visita)}>{v.estado_visita.replace(/_/g, ' ')}</Badge>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
              {dateTimeFmt(v.fecha_ejecutada ?? v.fecha_programada)}
            </span>
          </div>
          {v.verificador?.nombre_completo && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginBottom: '0.25rem' }}>
              Verificador: <span style={{ color: 'var(--color-text-2)' }}>{v.verificador.nombre_completo}</span>
            </p>
          )}
          {v.notas && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)', fontStyle: 'italic' }}>
              "{v.notas}"
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Loading skeleton ────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <Skeleton width="200px" height="16px" />
      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Skeleton width="44px" height="44px" rounded="md" />
          <div style={{ flex: 1 }}>
            <Skeleton width="240px" height="24px" />
            <Skeleton width="360px" height="14px" style={{ marginTop: '8px' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card" style={{ padding: '1rem' }}>
            <Skeleton width="100%" height="40px" />
          </div>
        ))}
      </div>
    </div>
  )
}
