import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Banknote,
  CreditCard,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  Route,
  MapPin,
  Users,
  Plus,
  Play,
} from 'lucide-react'
import {
  DataTable,
  SearchInput,
  Button,
  Badge,
  statusVariant,
  Select,
  Avatar,
  Tabs,
  Modal,
  Input,
  Skeleton,
} from '@/components/ui'
import type { Column } from '@/components/ui/DataTable'
import { useCobranza } from '@/hooks/useCobranza'
import { useRutas, crearRuta, useCollectorsAndZones } from '@/hooks/useRutas'
import type { Pago, RutaCobranza } from '@/types/cobranza'
import { toast } from '@/components/ui/Toast'

const PAGE_SIZE = 15

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateFmt = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const dateTimeFmt = (d: string) =>
  new Date(d).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const medioPagoIcon: Record<string, typeof Banknote> = {
  EFECTIVO: Banknote,
  YAPE: Smartphone,
  PLIN: Smartphone,
  TRANSFERENCIA_BANCARIA: CreditCard,
}

const medioPagoColor: Record<string, string> = {
  EFECTIVO: '#00E5A0',
  YAPE: '#6C2FC0',
  PLIN: '#00BCD4',
  TRANSFERENCIA_BANCARIA: '#5B8DEF',
}

const rutaEstadoConfig: Record<string, { color: string; label: string }> = {
  PLANIFICADA: { color: '#5B8DEF', label: 'Planificada' },
  EN_CURSO: { color: '#FFB547', label: 'En Curso' },
  CERRADA: { color: '#00E5A0', label: 'Cerrada' },
  CIERRE_CON_CUSTODIA: { color: '#A78BFA', label: 'Custodia' },
}

export default function CobranzaPage() {
  const [activeTab, setActiveTab] = useState('rutas')

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text-1)' }}>
            <span className="text-gradient">Cobranza</span>
          </h1>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)', marginTop: '2px' }}>
            Gestión de rutas y recaudación diaria
          </p>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'rutas', label: 'Rutas', icon: <Route size={14} /> },
          { id: 'pagos', label: 'Pagos', icon: <Banknote size={14} /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      >
        {(tab) => tab === 'rutas' ? <RutasTab /> : <PagosTab />}
      </Tabs>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Tab 1: RUTAS
   ══════════════════════════════════════════════════════════════ */

function RutasTab() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterEstado, setFilterEstado] = useState('')
  const [sortKey, setSortKey] = useState('fecha_ruta')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showNewModal, setShowNewModal] = useState(false)

  const { rutas, totalCount, loading, stats, refetch } = useRutas({
    page,
    pageSize: PAGE_SIZE,
    estado: filterEstado,
    sortKey,
    sortDirection: sortDir,
  })

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  const statCards = [
    { label: 'Rutas Hoy', value: String(stats.rutasHoy), icon: <Route size={20} />, color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)' },
    { label: 'En Curso', value: String(stats.enCurso), icon: <Play size={20} />, color: '#FFB547', bg: 'rgba(255,181,71,0.1)' },
    { label: 'Cerradas', value: String(stats.cerradas), icon: <CheckCircle size={20} />, color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
    { label: 'Recaudado Hoy', value: fmt(stats.recaudadoHoy), icon: <Banknote size={20} />, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  ] as const

  const columns: Column<RutaCobranza>[] = [
    {
      key: 'fecha_ruta',
      header: 'Fecha',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-text-2)' }}>
          {dateFmt(row.fecha_ruta)}
        </span>
      ),
    },
    {
      key: 'cobrador',
      header: 'Cobrador',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Avatar name={row.cobrador?.nombre_completo ?? '?'} size="sm" />
          <span style={{ fontWeight: 500, color: 'var(--color-text-1)' }}>
            {row.cobrador?.nombre_completo ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'zona',
      header: 'Zona',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
          <MapPin size={12} style={{ color: 'var(--color-text-3)' }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-2)' }}>
            {row.zona?.nombre ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'total_clientes',
      header: 'Clientes',
      align: 'center',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-1)' }}>
          <Users size={12} style={{ color: 'var(--color-text-3)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {row.total_clientes}
          </span>
        </div>
      ),
    },
    {
      key: 'total_recaudado',
      header: 'Recaudado',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-1)' }}>
          {fmt(row.total_recaudado)}
        </span>
      ),
    },
    {
      key: 'saldo_mano',
      header: 'Efectivo',
      align: 'right',
      render: (row) => {
        const isHigh = row.saldo_mano > 2000
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: isHigh ? 'var(--color-danger)' : 'var(--color-text-2)',
          }}>
            {fmt(row.saldo_mano)}
            {isHigh && <span style={{ fontSize: 'var(--fs-xs)', marginLeft: '4px' }}>⚠</span>}
          </span>
        )
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (row) => {
        const config = rutaEstadoConfig[row.estado] ?? { color: '#8B9DC3', label: row.estado }
        return (
          <Badge variant={statusVariant(row.estado)} dot>
            {config.label}
          </Badge>
        )
      },
    },
  ]

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {statCards.map((stat, i) => (
          <div key={stat.label} className={`glass-card animate-in delay-${i + 1}`} style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: stat.bg, flexShrink: 0 }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable<RutaCobranza>
        columns={columns}
        data={rutas}
        loading={loading}
        keyField="id"
        onRowClick={(row) => navigate(`/cobranza/${row.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        sortKey={sortKey}
        sortDirection={sortDir}
        onSort={handleSort}
        emptyTitle="No hay rutas"
        emptyDescription="No se encontraron rutas con los filtros aplicados."
        toolbar={
          <>
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'PLANIFICADA', label: 'Planificada' },
                { value: 'EN_CURSO', label: 'En Curso' },
                { value: 'CERRADA', label: 'Cerrada' },
                { value: 'CIERRE_CON_CUSTODIA', label: 'Custodia' },
              ]}
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value)
                setPage(1)
              }}
            />
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowNewModal(true)}
            >
              Nueva Ruta
            </Button>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
              Actualizar
            </Button>
          </>
        }
      />

      {showNewModal && (
        <NuevaRutaModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false)
            refetch()
          }}
        />
      )}
    </>
  )
}

/* ── Nueva Ruta Modal ── */

function NuevaRutaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { collectors, zones, loading } = useCollectorsAndZones()
  const [cobradorId, setCobradorId] = useState('')
  const [zonaId, setZonaId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!cobradorId || !zonaId || !fecha) {
      toast.warning('Completa todos los campos')
      return
    }
    setSaving(true)
    const { error } = await crearRuta({
      cobrador_id: cobradorId,
      zona_id: zonaId,
      fecha_ruta: fecha,
    })
    setSaving(false)
    if (error) {
      toast.error(`Error: ${error}`)
    } else {
      toast.success('Ruta creada exitosamente')
      onCreated()
    }
  }

  return (
    <Modal open={true} title="Nueva Ruta de Cobranza" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>
            Fecha
          </label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>
            Cobrador
          </label>
          {loading ? (
            <Skeleton width="100%" height="38px" />
          ) : (
            <Select
              options={[
                { value: '', label: 'Seleccionar cobrador...' },
                ...collectors.map((c) => ({ value: c.id, label: c.nombre_completo })),
              ]}
              value={cobradorId}
              onChange={(e) => setCobradorId(e.target.value)}
            />
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>
            Zona
          </label>
          {loading ? (
            <Skeleton width="100%" height="38px" />
          ) : (
            <Select
              options={[
                { value: '', label: 'Seleccionar zona...' },
                ...zones.map((z) => ({ value: z.id, label: z.nombre })),
              ]}
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)}
            />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creando...' : 'Crear Ruta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ══════════════════════════════════════════════════════════════
   Tab 2: PAGOS (existing, moved to component)
   ══════════════════════════════════════════════════════════════ */

function PagosTab() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterMedio, setFilterMedio] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('fecha_pago')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { pagos, totalCount, loading, stats, refetch } = useCobranza({
    page,
    pageSize: PAGE_SIZE,
    medioPago: filterMedio,
    estado: filterEstado,
    search,
    sortKey,
    sortDirection: sortDir,
  })

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  const statCards = [
    { label: 'Recaudado Hoy', value: fmt(stats.totalRecaudadoHoy), icon: <Banknote size={20} />, color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
    { label: 'Pagos Hoy', value: String(stats.pagosHoy), icon: <CheckCircle size={20} />, color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)' },
    { label: 'Efectivo', value: fmt(stats.efectivo), icon: <Banknote size={20} />, color: '#FFB547', bg: 'rgba(255,181,71,0.1)' },
    { label: 'Digital', value: fmt(stats.digital), icon: <Smartphone size={20} />, color: '#00BCD4', bg: 'rgba(0,188,212,0.1)' },
  ] as const

  const columns: Column<Pago>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <Avatar
            name={row.cliente?.nombre_completo ?? '?'}
            src={row.cliente?.foto_url}
            size="sm"
          />
          <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-1)', fontSize: 'var(--fs-base)' }}>
              {row.cliente?.nombre_completo ?? '—'}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
              {row.cliente?.dni ?? '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      sortable: true,
      render: (row) => {
        const isAnulado = row.estado === 'ANULADO' || row.estado === 'EXTORNADO'
        return (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: 'var(--fs-md)',
              color: isAnulado ? 'var(--color-danger)' : 'var(--color-text-1)',
              textDecoration: isAnulado ? 'line-through' : 'none',
              opacity: isAnulado ? 0.6 : 1,
            }}
          >
            {fmt(row.monto)}
          </span>
        )
      },
    },
    {
      key: 'medio_pago',
      header: 'Medio',
      align: 'center',
      render: (row) => {
        const Icon = medioPagoIcon[row.medio_pago] ?? CreditCard
        const color = medioPagoColor[row.medio_pago] ?? 'var(--color-text-2)'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
            <div
              style={{
                width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: `${color}15`,
              }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-2)' }}>
              {row.medio_pago.replace(/_/g, ' ')}
            </span>
          </div>
        )
      },
    },
    {
      key: 'cobrador',
      header: 'Cobrador',
      render: (row) => (
        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-2)' }}>
          {row.cobrador?.nombre_completo ?? 'Directo'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (row) => {
        const isOk = ['CONCILIADO', 'REGISTRADO', 'RECAUDADO_EN_CAMPO'].includes(row.estado)
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-1)' }}>
            {isOk ? (
              <CheckCircle size={12} style={{ color: 'var(--color-success)', opacity: 0.6 }} />
            ) : row.estado === 'ANULADO' || row.estado === 'EXTORNADO' ? (
              <XCircle size={12} style={{ color: 'var(--color-danger)', opacity: 0.6 }} />
            ) : (
              <Clock size={12} style={{ color: 'var(--color-warning)', opacity: 0.6 }} />
            )}
            <Badge variant={statusVariant(row.estado)} dot>
              {row.estado.replace(/_/g, ' ')}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'fecha_pago',
      header: 'Fecha',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          {dateTimeFmt(row.fecha_pago)}
        </span>
      ),
    },
  ]

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {statCards.map((stat, i) => (
          <div key={stat.label} className={`glass-card animate-in delay-${i + 1}`} style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: stat.bg, flexShrink: 0 }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable<Pago>
        columns={columns}
        data={pagos}
        loading={loading}
        keyField="id"
        onRowClick={(row) => navigate(`/clientes/${row.cliente_id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        sortKey={sortKey}
        sortDirection={sortDir}
        onSort={handleSort}
        emptyTitle="No hay pagos"
        emptyDescription="No se encontraron pagos registrados con los filtros aplicados."
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar cliente..."
            />
            <Select
              options={[
                { value: '', label: 'Todos los medios' },
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'YAPE', label: 'Yape' },
                { value: 'PLIN', label: 'Plin' },
                { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia' },
              ]}
              value={filterMedio}
              onChange={(e) => {
                setFilterMedio(e.target.value)
                setPage(1)
              }}
            />
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'REGISTRADO', label: 'Registrado' },
                { value: 'RECAUDADO_EN_CAMPO', label: 'En Campo' },
                { value: 'PENDIENTE_CONCILIACION', label: 'Pendiente' },
                { value: 'CONCILIADO', label: 'Conciliado' },
                { value: 'ANULADO', label: 'Anulado' },
              ]}
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value)
                setPage(1)
              }}
            />
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
              Actualizar
            </Button>
          </>
        }
      />
    </>
  )
}
