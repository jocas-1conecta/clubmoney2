import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  RefreshCw,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRightCircle,
  Shield,
  Plus,
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
import { useSolicitudes } from '@/hooks/useSolicitudes'
import { useAuth } from '@/hooks/useAuth'
import NuevaSolicitudModal from '@/components/solicitudes/NuevaSolicitudModal'
import type { Solicitud } from '@/types/solicitudes'

const PAGE_SIZE = 15

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateFmt = (d: string) =>
  new Date(d).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const timeSince = (d: string) => {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'Hace un momento'
  if (h < 24) return `Hace ${h}h`
  const days = Math.floor(h / 24)
  return `Hace ${days}d`
}

/** Workflow icon per estado */
const estadoIcons: Record<string, typeof FileText> = {
  INGRESADA: FileText,
  EN_EVALUACION: Eye,
  VERIFICACION_CAMPO: Shield,
  APROBADA: CheckCircle,
  RECHAZADA: XCircle,
  OBSERVADA: Clock,
  EN_FORMALIZACION: ArrowRightCircle,
}

export default function SolicitudesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { solicitudes, totalCount, loading, zonas, refetch, createSolicitud } = useSolicitudes({
    page,
    pageSize: PAGE_SIZE,
    search,
    estado: filterEstado,
    sortKey,
    sortDirection: sortDir,
  })

  const { hasRole } = useAuth()
  const canCreate = hasRole('ASESOR_COMERCIAL') || hasRole('GERENCIA')
  const [modalOpen, setModalOpen] = useState(false)

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  const columns: Column<Solicitud>[] = [
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
              <User size={11} />
              {row.cliente?.dni ?? '—'}
              {row.es_renovacion && (
                <Badge variant="accent">Renovación</Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'monto_solicitado',
      header: 'Monto',
      sortable: true,
      render: (row) => (
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-md)', color: 'var(--color-text-1)' }}>
            {fmt(row.monto_solicitado)}
          </span>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
            {row.tasa_interes}% · {row.plazo_dias}d
          </div>
        </div>
      ),
    },
    {
      key: 'tipo_cronograma',
      header: 'Tipo',
      align: 'center',
      render: (row) => (
        <Badge variant="neutral">{row.tipo_cronograma}</Badge>
      ),
    },
    {
      key: 'asesor',
      header: 'Asesor',
      render: (row) => (
        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-2)' }}>
          {row.asesor?.nombre_completo ?? '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (row) => {
        const Icon = estadoIcons[row.estado] ?? FileText
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
            <Icon size={13} style={{ opacity: 0.6 }} />
            <Badge variant={statusVariant(row.estado)} dot>
              {row.estado.replace(/_/g, ' ')}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Fecha',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            {dateFmt(row.created_at)}
          </span>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', opacity: 0.6 }}>
            {timeSince(row.created_at)}
          </div>
        </div>
      ),
    },
  ]

  // Pipeline summary cards
  const pipeline = [
    { key: 'INGRESADA', label: 'Ingresadas', color: '#8B9DC3', bg: 'rgba(139,157,195,0.1)' },
    { key: 'EN_EVALUACION', label: 'En Evaluación', color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)' },
    { key: 'VERIFICACION_CAMPO', label: 'Verificación', color: '#FFB547', bg: 'rgba(255,181,71,0.1)' },
    { key: 'APROBADA', label: 'Aprobadas', color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
  ] as const

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text-1)' }}>
            <span className="text-gradient">Solicitudes</span>
          </h1>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)', marginTop: '2px' }}>
            Pipeline de originación de crédito
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          {canCreate && (
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setModalOpen(true)} data-onboarding="nueva-solicitud">
              Nueva Solicitud
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div data-onboarding="pipeline-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {pipeline.map((stage, i) => {
          const count = solicitudes.filter((s) => s.estado === stage.key).length
          const Icon = estadoIcons[stage.key]
          return (
            <div
              key={stage.key}
              className={`glass-card animate-in delay-${i + 1}`}
              style={{
                padding: 'var(--sp-4)',
                cursor: 'pointer',
                borderColor: filterEstado === stage.key ? stage.color : undefined,
              }}
              onClick={() => {
                setFilterEstado(filterEstado === stage.key ? '' : stage.key)
                setPage(1)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <div
                  style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: stage.bg,
                  }}
                >
                  <Icon size={18} style={{ color: stage.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>
                    {filterEstado ? (filterEstado === stage.key ? totalCount : '—') : count}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>
                    {stage.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div data-onboarding="tabla-solicitudes">
      <DataTable<Solicitud>
        columns={columns}
        data={solicitudes}
        loading={loading}
        keyField="id"
        onRowClick={(row) => navigate(`/solicitudes/${row.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        sortKey={sortKey}
        sortDirection={sortDir}
        onSort={handleSort}
        emptyTitle="No hay solicitudes"
        emptyDescription="No se encontraron solicitudes de préstamo con los filtros aplicados."
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Buscar solicitud..."
            />
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'INGRESADA', label: 'Ingresada' },
                { value: 'EN_EVALUACION', label: 'En Evaluación' },
                { value: 'VERIFICACION_CAMPO', label: 'Verificación Campo' },
                { value: 'APROBADA', label: 'Aprobada' },
                { value: 'RECHAZADA', label: 'Rechazada' },
                { value: 'OBSERVADA', label: 'Observada' },
                { value: 'EN_FORMALIZACION', label: 'En Formalización' },
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

      {/* Modal */}
      <NuevaSolicitudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        zonas={zonas}
        onCreated={refetch}
        createSolicitud={createSolicitud}
      />
    </div>
  )
}
