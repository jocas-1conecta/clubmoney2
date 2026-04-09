import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  AlertTriangle,
  Flame,
  Gavel,
  Clock,
  Phone,
} from 'lucide-react'
import {
  DataTable,
  Button,
  Badge,
  statusVariant,
  Select,
  Avatar,
} from '@/components/ui'
import type { Column } from '@/components/ui/DataTable'
import { useMorosidad } from '@/hooks/useMorosidad'
import type { CasoMorosidad, CategoriaMora } from '@/types/morosidad'

const PAGE_SIZE = 15

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Severity ring color */
const catConfig: Record<CategoriaMora, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  MORA_TEMPRANA: { label: 'Temprana', color: '#FFB547', bg: 'rgba(255,181,71,0.1)', icon: Clock },
  MORA_MEDIA: { label: 'Media', color: '#FF8C42', bg: 'rgba(255,140,66,0.1)', icon: AlertTriangle },
  MORA_GRAVE: { label: 'Grave', color: '#FF5C5C', bg: 'rgba(255,92,92,0.1)', icon: Flame },
  PREJURIDICO: { label: 'Pre-Jurídico', color: '#C850C0', bg: 'rgba(200,80,192,0.1)', icon: Gavel },
}

export default function MorosidadPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterCat, setFilterCat] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [sortKey, setSortKey] = useState('dias_sin_pago')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { casos, totalCount, loading, stats, refetch } = useMorosidad({
    page,
    pageSize: PAGE_SIZE,
    categoria: filterCat,
    estado: filterEstado,
    sortKey,
    sortDirection: sortDir,
  })

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  // Severity distribution cards
  const severityCards = [
    { key: 'MORA_TEMPRANA' as CategoriaMora, count: stats.temprana },
    { key: 'MORA_MEDIA' as CategoriaMora, count: stats.media },
    { key: 'MORA_GRAVE' as CategoriaMora, count: stats.grave },
    { key: 'PREJURIDICO' as CategoriaMora, count: stats.prejuridico },
  ]

  const columns: Column<CasoMorosidad>[] = [
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
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
              {row.cliente?.dni ?? '—'}
              {row.cliente?.telefono && (
                <>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <Phone size={10} style={{ opacity: 0.5 }} />
                  {row.cliente.telefono}
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'dias_sin_pago',
      header: 'Días Mora',
      sortable: true,
      align: 'center',
      render: (row) => {
        const cfg = catConfig[row.categoria_mora]
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-lg)',
              fontWeight: 700,
              color: cfg.color,
            }}>
              {row.dias_sin_pago}
            </span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>días</span>
          </div>
        )
      },
    },
    {
      key: 'monto_vencido',
      header: 'Monto Vencido',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--fs-md)', color: 'var(--color-danger)' }}>
          {fmt(row.monto_vencido)}
        </span>
      ),
    },
    {
      key: 'categoria_mora',
      header: 'Categoría',
      align: 'center',
      render: (row) => {
        const cfg = catConfig[row.categoria_mora]
        const Icon = cfg.icon
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
            <div
              style={{
                width: '24px', height: '24px', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: cfg.bg,
              }}
            >
              <Icon size={12} style={{ color: cfg.color }} />
            </div>
            <span style={{ fontSize: 'var(--fs-sm)', color: cfg.color, fontWeight: 600 }}>
              {cfg.label}
            </span>
          </div>
        )
      },
    },
    {
      key: 'tiene_promesa_pago',
      header: 'Promesa',
      align: 'center',
      render: (row) => (
        row.tiene_promesa_pago ? (
          <div style={{ textAlign: 'center' }}>
            <Badge variant="accent">Sí</Badge>
            {row.fecha_promesa_pago && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '2px' }}>
                {new Date(row.fecha_promesa_pago).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', opacity: 0.5 }}>—</span>
        )
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
      key: 'asignado',
      header: 'Gestor',
      render: (row) => (
        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-2)' }}>
          {row.asignado?.nombre_completo ?? 'Sin asignar'}
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
            <span className="text-gradient">Morosidad</span>
          </h1>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)', marginTop: '2px' }}>
            Gestión de casos de mora y cobranza difícil
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          {stats.totalCasos > 0 && (
            <div style={{
              padding: 'var(--sp-2) var(--sp-3)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,92,92,0.1)',
              border: '1px solid rgba(255,92,92,0.2)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: 'var(--color-danger)',
              fontFamily: 'var(--font-mono)',
            }}>
              {fmt(stats.montoTotal)} en riesgo
            </div>
          )}
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Severity distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {severityCards.map((card, i) => {
          const cfg = catConfig[card.key]
          const Icon = cfg.icon
          return (
            <div
              key={card.key}
              className={`glass-card animate-in delay-${i + 1}`}
              style={{
                padding: 'var(--sp-4)',
                cursor: 'pointer',
                borderColor: filterCat === card.key ? cfg.color : undefined,
              }}
              onClick={() => {
                setFilterCat(filterCat === card.key ? '' : card.key)
                setPage(1)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <div
                  style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: cfg.bg,
                  }}
                >
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>
                    {card.count}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.color }}>
                    {cfg.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <DataTable<CasoMorosidad>
        columns={columns}
        data={casos}
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
        emptyTitle="No hay casos de morosidad"
        emptyDescription="No se encontraron casos de mora activos. ¡Buena cartera!"
        toolbar={
          <>
            <Select
              options={[
                { value: '', label: 'Todas las categorías' },
                { value: 'MORA_TEMPRANA', label: 'Temprana' },
                { value: 'MORA_MEDIA', label: 'Media' },
                { value: 'MORA_GRAVE', label: 'Grave' },
                { value: 'PREJURIDICO', label: 'Pre-Jurídico' },
              ]}
              value={filterCat}
              onChange={(e) => {
                setFilterCat(e.target.value)
                setPage(1)
              }}
            />
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'ABIERTO', label: 'Abierto' },
                { value: 'EN_GESTION', label: 'En Gestión' },
                { value: 'ESCALADO_CAMPO', label: 'Escalado' },
                { value: 'RECUPERADO', label: 'Recuperado' },
                { value: 'REFINANCIADO', label: 'Refinanciado' },
                { value: 'CASTIGO', label: 'Castigo' },
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
