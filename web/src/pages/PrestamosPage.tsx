import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  Banknote,
} from 'lucide-react'
import {
  DataTable,
  SearchInput,
  Button,
  Badge,
  statusVariant,
  Select,
  Avatar,
} from '@/components/ui'
import type { Column } from '@/components/ui/DataTable'
import { usePrestamos } from '@/hooks/usePrestamos'
import type { Prestamo } from '@/types/prestamos'

const PAGE_SIZE = 15

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateFmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

/** Calculate days remaining or days overdue */
const daysInfo = (vencimiento: string) => {
  const diff = Math.ceil((new Date(vencimiento).getTime() - Date.now()) / 86400000)
  if (diff > 0) return { text: `${diff}d restantes`, color: 'var(--color-text-3)' }
  if (diff === 0) return { text: 'Vence hoy', color: 'var(--color-warning)' }
  return { text: `${Math.abs(diff)}d vencido`, color: 'var(--color-danger)' }
}

/** Progress bar % */
const progress = (total: number, saldo: number) => {
  if (total <= 0) return 100
  return Math.round(((total - saldo) / total) * 100)
}

export default function PrestamosPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { prestamos, totalCount, loading, refetch } = usePrestamos({
    page,
    pageSize: PAGE_SIZE,
    search,
    estado: filterEstado,
    sortKey,
    sortDirection: sortDir,
  })

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  // Aggregate stats
  const activos = prestamos.filter((p) => p.estado === 'ACTIVO')
  const carteraTotal = activos.reduce((s, p) => s + p.saldo_pendiente, 0)
  const enMora = prestamos.filter((p) => p.estado === 'EN_MORA').length
  const vencidos = prestamos.filter((p) => p.estado === 'VENCIDO').length

  const stats = [
    { label: 'Préstamos Activos', value: String(activos.length), icon: <TrendingUp size={20} />, color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
    { label: 'Cartera Vigente', value: fmt(carteraTotal), icon: <Banknote size={20} />, color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)' },
    { label: 'Vencidos', value: String(vencidos), icon: <Clock size={20} />, color: '#FFB547', bg: 'rgba(255,181,71,0.1)' },
    { label: 'En Mora', value: String(enMora), icon: <AlertTriangle size={20} />, color: '#FF5C5C', bg: 'rgba(255,92,92,0.1)' },
  ] as const

  const columns: Column<Prestamo>[] = [
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
      key: 'monto_capital',
      header: 'Capital',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-md)', color: 'var(--color-text-1)' }}>
          {fmt(row.monto_capital)}
        </span>
      ),
    },
    {
      key: 'progreso',
      header: 'Progreso',
      render: (row) => {
        const pct = progress(row.monto_total_pagar, row.saldo_pendiente)
        return (
          <div style={{ minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: '4px' }}>
              <span style={{ color: 'var(--color-text-3)' }}>Pagado</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: 'var(--color-surface-3)' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: pct >= 100
                    ? 'var(--color-success)'
                    : pct >= 50
                    ? 'linear-gradient(90deg, #00E5A0, #5B8DEF)'
                    : 'var(--color-warning)',
                  transition: 'width var(--dur-slow) var(--ease-out)',
                }}
              />
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '2px' }}>
              Saldo: <span style={{ fontFamily: 'var(--font-mono)', color: row.saldo_pendiente > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>{fmt(row.saldo_pendiente)}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'plazo',
      header: 'Plazo',
      align: 'center',
      render: (row) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-1)' }}>{row.plazo_dias}d</span>
          <div style={{ fontSize: 'var(--fs-xs)', color: daysInfo(row.fecha_vencimiento).color }}>
            {daysInfo(row.fecha_vencimiento).text}
          </div>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (row) => (
        <Badge variant={statusVariant(row.estado)} dot>
          {row.estado.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'fecha_desembolso',
      header: 'Desembolso',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          {dateFmt(row.fecha_desembolso)}
        </span>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text-1)' }}>
            <span className="text-gradient">Préstamos</span>
          </h1>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)', marginTop: '2px' }}>
            Gestión de cartera activa
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {stats.map((stat, i) => (
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
      <DataTable<Prestamo>
        columns={columns}
        data={prestamos}
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
        emptyTitle="No hay préstamos"
        emptyDescription="No se encontraron préstamos con los filtros aplicados."
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Buscar préstamo..."
            />
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'PENDIENTE_DESEMBOLSO', label: 'Pendiente Desembolso' },
                { value: 'ACTIVO', label: 'Activo' },
                { value: 'VENCIDO', label: 'Vencido' },
                { value: 'EN_MORA', label: 'En Mora' },
                { value: 'CANCELADO', label: 'Cancelado' },
              ]}
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value)
                setPage(1)
              }}
            />
          </>
        }
      />
    </div>
  )
}
