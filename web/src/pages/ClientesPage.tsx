import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Star,
  RefreshCw,
} from 'lucide-react'
import {
  DataTable,
  SearchInput,
  Button,
  Badge,
  statusVariant,
  Select,
  Modal,
  Input,
  Avatar,
  toast,
} from '@/components/ui'
import type { Column } from '@/components/ui/DataTable'
import { useClientes } from '@/hooks/useClientes'
import type { Cliente, ClienteFormData } from '@/types/clientes'

const PAGE_SIZE = 15

const calificacionIcons: Record<string, string> = {
  EXCELENTE: '⭐',
  BUENO: '👍',
  REGULAR: '⚠️',
  MALO: '🔻',
}

export default function ClientesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterZona, setFilterZona] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const {
    clientes,
    totalCount,
    loading,
    zonas,
    createCliente,
    refetch,
  } = useClientes({
    page,
    pageSize: PAGE_SIZE,
    search,
    estado: filterEstado,
    zonaId: filterZona,
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

  async function handleCreate(data: ClienteFormData) {
    const { error } = await createCliente(data)
    if (error) {
      toast.error('Error al crear cliente', error)
    } else {
      toast.success('Cliente creado', `${data.nombre_completo} fue registrado exitosamente.`)
      setShowCreateModal(false)
    }
  }

  const columns: Column<Cliente>[] = [
    {
      key: 'nombre_completo',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <Avatar name={row.nombre_completo} src={row.foto_url} size="sm" />
          <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-1)' }}>
              {row.nombre_completo}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
              <IdCard size={11} />
              {row.dni}
              {row.es_cliente_recurrente && (
                <span style={{ marginLeft: 'var(--sp-1)', fontSize: 'var(--fs-xs)', padding: '0 4px', borderRadius: '4px', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                  Recurrente
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'telefono',
      header: 'Contacto',
      render: (row) => (
        <div style={{ fontSize: 'var(--fs-base)' }}>
          {row.telefono ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', color: 'var(--color-text-1)' }}>
              <Phone size={12} style={{ opacity: 0.5 }} />
              {row.telefono}
            </div>
          ) : null}
          {row.email ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', color: 'var(--color-text-3)', fontSize: 'var(--fs-sm)' }}>
              <Mail size={11} style={{ opacity: 0.5 }} />
              {row.email}
            </div>
          ) : null}
          {!row.telefono && !row.email && <span style={{ color: 'var(--color-text-3)' }}>—</span>}
        </div>
      ),
    },
    {
      key: 'zona',
      header: 'Zona',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', fontSize: 'var(--fs-base)' }}>
          <MapPin size={13} style={{ color: 'var(--color-text-3)' }} />
          <span style={{ color: 'var(--color-text-2)' }}>
            {row.zona?.nombre ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'calificacion_interna',
      header: 'Calificación',
      sortable: true,
      align: 'center',
      render: (row) =>
        row.calificacion_interna ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-1)', fontSize: 'var(--fs-sm)' }}>
            <span>{calificacionIcons[row.calificacion_interna] ?? ''}</span>
            <Badge variant={statusVariant(row.calificacion_interna)}>
              {row.calificacion_interna}
            </Badge>
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-3)' }}>—</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      align: 'center',
      render: (row) => (
        <Badge variant={statusVariant(row.estado)} dot>
          {row.estado}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          {new Date(row.created_at).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
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
            <span className="text-gradient">Clientes</span>
          </h1>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)', marginTop: '2px' }}>
            {totalCount} {totalCount === 1 ? 'cliente registrado' : 'clientes registrados'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={refetch}
          >
            Actualizar
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable<Cliente>
        columns={columns}
        data={clientes}
        loading={loading}
        keyField="id"
        onRowClick={(row) => navigate(`/clientes/${row.id}`)}
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        sortKey={sortKey}
        sortDirection={sortDir}
        onSort={handleSort}
        emptyTitle="No hay clientes"
        emptyDescription="Aún no se han registrado clientes. Comienza creando el primero."
        emptyAction={
          <Button variant="primary" icon={<UserPlus size={16} />} onClick={() => setShowCreateModal(true)}>
            Crear primer cliente
          </Button>
        }
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Buscar por nombre, DNI o teléfono..."
            />
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'ACTIVO', label: 'Activo' },
                { value: 'INACTIVO', label: 'Inactivo' },
                { value: 'BLOQUEADO', label: 'Bloqueado' },
              ]}
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value)
                setPage(1)
              }}
            />
            {zonas.length > 0 && (
              <Select
                options={[
                  { value: '', label: 'Todas las zonas' },
                  ...zonas.map((z) => ({ value: z.id, label: z.nombre })),
                ]}
                value={filterZona}
                onChange={(e) => {
                  setFilterZona(e.target.value)
                  setPage(1)
                }}
              />
            )}
          </>
        }
      />

      {/* Create modal */}
      <ClienteFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        zonas={zonas}
      />
    </div>
  )
}

// ─── Create/Edit Modal ──────────────────────────────────────────
interface ClienteFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ClienteFormData) => Promise<void>
  zonas: { id: string; nombre: string }[]
  initialData?: Partial<ClienteFormData>
  title?: string
}

function ClienteFormModal({
  open,
  onClose,
  onSubmit,
  zonas,
  initialData,
  title = 'Nuevo Cliente',
}: ClienteFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data: ClienteFormData = {
      dni: (fd.get('dni') as string).trim(),
      nombre_completo: (fd.get('nombre_completo') as string).trim(),
      telefono: (fd.get('telefono') as string).trim() || undefined,
      telefono_secundario: (fd.get('telefono_secundario') as string).trim() || undefined,
      email: (fd.get('email') as string).trim() || undefined,
      direccion: (fd.get('direccion') as string).trim() || undefined,
      referencia_direccion: (fd.get('referencia_direccion') as string).trim() || undefined,
      zona_id: (fd.get('zona_id') as string) || undefined,
    }

    // Validation
    const newErrors: Record<string, string> = {}
    if (!data.dni || data.dni.length !== 8 || !/^\d{8}$/.test(data.dni)) {
      newErrors.dni = 'DNI debe tener exactamente 8 dígitos'
    }
    if (!data.nombre_completo || data.nombre_completo.length < 3) {
      newErrors.nombre_completo = 'Nombre es requerido (mín. 3 caracteres)'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await onSubmit(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Ingresa los datos del cliente para registrarlo en el sistema."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={loading} type="submit" form="cliente-form">
            <Star size={14} />
            Guardar Cliente
          </Button>
        </>
      }
    >
      <form id="cliente-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <Input
            name="dni"
            label="DNI"
            placeholder="12345678"
            maxLength={8}
            icon={<IdCard size={14} />}
            error={errors.dni}
            defaultValue={initialData?.dni}
            required
          />
          <Input
            name="nombre_completo"
            label="Nombre Completo"
            placeholder="Juan Pérez García"
            error={errors.nombre_completo}
            defaultValue={initialData?.nombre_completo}
            required
          />
          <Input
            name="telefono"
            label="Teléfono"
            placeholder="987654321"
            icon={<Phone size={14} />}
            defaultValue={initialData?.telefono}
          />
          <Input
            name="telefono_secundario"
            label="Teléfono Secundario"
            placeholder="912345678"
            icon={<Phone size={14} />}
            defaultValue={initialData?.telefono_secundario}
          />
          <Input
            name="email"
            label="Email"
            type="email"
            placeholder="correo@ejemplo.com"
            icon={<Mail size={14} />}
            defaultValue={initialData?.email}
          />
          <Select
            name="zona_id"
            label="Zona"
            placeholder="Selecciona zona"
            options={zonas.map((z) => ({ value: z.id, label: z.nombre }))}
            defaultValue={initialData?.zona_id}
          />
        </div>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Input
            name="direccion"
            label="Dirección"
            placeholder="Av. Principal 123, distrito"
            icon={<MapPin size={14} />}
            defaultValue={initialData?.direccion}
          />
        </div>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Input
            name="referencia_direccion"
            label="Referencia de Dirección"
            placeholder="Frente al mercado, casa color azul"
            defaultValue={initialData?.referencia_direccion}
          />
        </div>
      </form>
    </Modal>
  )
}
