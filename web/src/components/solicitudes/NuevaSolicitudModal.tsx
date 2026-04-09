import { useState, useCallback } from 'react'
import {
  Search,
  UserPlus,
  DollarSign,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { Modal, Input, Select, Button, toast } from '@/components/ui'
import DocumentUploader from './DocumentUploader'
import type { UploadedDoc } from './DocumentUploader'
import type { SolicitudFormData } from '@/types/solicitudes'
import type { Zona } from '@/types/clientes'
import { useAuth } from '@/hooks/useAuth'

/* ─── Types ────────────────────────────────────────────────── */

interface NuevaSolicitudModalProps {
  open: boolean
  onClose: () => void
  zonas: Zona[]
  onCreated: () => void
  createSolicitud: (data: SolicitudFormData & { asesor_id: string }) => Promise<{ id: string | null; error: string | null }>
}

interface ClienteFound {
  id: string
  dni: string
  nombre_completo: string
  telefono: string | null
  direccion: string | null
  es_cliente_recurrente: boolean
  calificacion_interna: string | null
  zona?: { nombre: string } | null
}

type Step = 'cliente' | 'condiciones' | 'documentos'

const STEPS: { key: Step; label: string; icon: typeof User }[] = [
  { key: 'cliente', label: 'Cliente', icon: User },
  { key: 'condiciones', label: 'Condiciones', icon: DollarSign },
  { key: 'documentos', label: 'Documentos', icon: FileText },
]

const TIPO_CRONOGRAMA_OPTIONS = [
  { value: 'FIJO', label: 'Fijo — Cuota diaria constante' },
  { value: 'FLEXIBLE', label: 'Flexible — Montos variables' },
  { value: 'HIBRIDO', label: 'Híbrido — Mix fijo + flexible' },
]

const PLAZO_OPTIONS = [
  { value: '15', label: '15 días' },
  { value: '20', label: '20 días' },
  { value: '30', label: '30 días' },
  { value: '45', label: '45 días' },
  { value: '60', label: '60 días' },
]

/* ─── Component ────────────────────────────────────────────── */

export default function NuevaSolicitudModal({
  open,
  onClose,
  zonas,
  onCreated,
  createSolicitud,
}: NuevaSolicitudModalProps) {
  const { user } = useAuth()

  // Step state
  const [step, setStep] = useState<Step>('cliente')

  // Step 1 — Cliente
  const [dniSearch, setDniSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [clienteFound, setClienteFound] = useState<ClienteFound | null>(null)
  const [clienteNotFound, setClienteNotFound] = useState(false)
  const [isNewCliente, setIsNewCliente] = useState(false)
  const [newCliente, setNewCliente] = useState({
    nombre_completo: '',
    telefono: '',
    direccion: '',
    referencia_direccion: '',
    zona_id: '',
  })
  const [clienteId, setClienteId] = useState<string | null>(null)

  // Step 2 — Condiciones
  const [condiciones, setCondiciones] = useState({
    monto_solicitado: '',
    plazo_dias: '30',
    tasa_interes: '20',
    tipo_cronograma: 'FIJO',
    es_renovacion: false,
  })

  // Step 3 — Documentos
  const [solicitudId, setSolicitudId] = useState<string | null>(null)
  const [, setUploadedDocs] = useState<UploadedDoc[]>([])

  // General
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /* ── Reset ── */
  const resetForm = useCallback(() => {
    setStep('cliente')
    setDniSearch('')
    setSearching(false)
    setClienteFound(null)
    setClienteNotFound(false)
    setIsNewCliente(false)
    setNewCliente({ nombre_completo: '', telefono: '', direccion: '', referencia_direccion: '', zona_id: '' })
    setClienteId(null)
    setCondiciones({ monto_solicitado: '', plazo_dias: '30', tasa_interes: '20', tipo_cronograma: 'FIJO', es_renovacion: false })
    setSolicitudId(null)
    setUploadedDocs([])
    setSubmitting(false)
    setErrors({})
  }, [])

  function handleClose() {
    resetForm()
    onClose()
  }

  /* ── Step 1: Search by DNI ── */
  async function searchByDni() {
    const dni = dniSearch.trim()
    if (dni.length !== 8) {
      setErrors({ dni: 'El DNI debe tener 8 dígitos' })
      return
    }
    setErrors({})
    setSearching(true)
    setClienteFound(null)
    setClienteNotFound(false)
    setIsNewCliente(false)

    const { data, error } = await supabase
      .from('clientes')
      .select('id, dni, nombre_completo, telefono, direccion, es_cliente_recurrente, calificacion_interna, zona:zonas(nombre)')
      .eq('dni', dni)
      .maybeSingle()

    setSearching(false)

    if (error) {
      toast.error('Error al buscar cliente', error.message)
      return
    }

    if (data) {
      setClienteFound(data as unknown as ClienteFound)
      setClienteId(data.id)
    } else {
      setClienteNotFound(true)
    }
  }

  function startNewCliente() {
    setIsNewCliente(true)
    setClienteNotFound(false)
  }

  /* ── Step 1: Create inline client ── */
  async function createInlineCliente() {
    const errs: Record<string, string> = {}
    if (!newCliente.nombre_completo.trim()) errs.nombre = 'Nombre requerido'
    if (!newCliente.telefono.trim()) errs.telefono = 'Teléfono requerido'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return false
    }

    setSubmitting(true)
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        dni: dniSearch.trim(),
        nombre_completo: newCliente.nombre_completo.trim(),
        telefono: newCliente.telefono.trim() || null,
        direccion: newCliente.direccion.trim() || null,
        referencia_direccion: newCliente.referencia_direccion.trim() || null,
        zona_id: newCliente.zona_id || null,
        registrado_por: user?.id ?? null,
      })
      .select('id')
      .single()

    setSubmitting(false)

    if (error) {
      toast.error('Error al crear cliente', error.message)
      return false
    }

    setClienteId(data.id)
    setClienteFound({
      id: data.id,
      dni: dniSearch.trim(),
      nombre_completo: newCliente.nombre_completo.trim(),
      telefono: newCliente.telefono.trim(),
      direccion: newCliente.direccion.trim(),
      es_cliente_recurrente: false,
      calificacion_interna: null,
    })
    setIsNewCliente(false)
    toast.success('Cliente creado', `${newCliente.nombre_completo} registrado exitosamente`)
    return true
  }

  /* ── Validate step ── */
  function validateStep1(): boolean {
    if (!clienteId) {
      toast.warning('Selecciona o crea un cliente primero')
      return false
    }
    return true
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {}
    const monto = parseFloat(condiciones.monto_solicitado)
    if (!condiciones.monto_solicitado || isNaN(monto) || monto <= 0) {
      errs.monto = 'Ingresa un monto válido'
    }
    if (monto > 50000) {
      errs.monto = 'El monto máximo es S/ 50,000'
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return false
    }
    setErrors({})
    return true
  }

  /* ── Step 2 → Step 3: Create solicitud ── */
  async function handleCreateSolicitud() {
    if (!validateStep2()) return
    if (!clienteId || !user?.id) return

    setSubmitting(true)

    const payload: SolicitudFormData & { asesor_id: string } = {
      cliente_id: clienteId,
      asesor_id: user.id,
      monto_solicitado: parseFloat(condiciones.monto_solicitado),
      plazo_dias: parseInt(condiciones.plazo_dias),
      tasa_interes: parseFloat(condiciones.tasa_interes),
      tipo_cronograma: condiciones.tipo_cronograma as 'FIJO' | 'FLEXIBLE' | 'HIBRIDO',
      es_renovacion: condiciones.es_renovacion,
    }

    const { id, error } = await createSolicitud(payload)

    setSubmitting(false)

    if (error) {
      toast.error('Error al crear solicitud', error)
      return
    }

    setSolicitudId(id)
    setStep('documentos')
    toast.success('Solicitud creada', 'Ahora sube los documentos del expediente')
  }

  /* ── Step navigation ── */
  async function goNext() {
    if (step === 'cliente') {
      if (isNewCliente) {
        const created = await createInlineCliente()
        if (!created) return
      }
      if (!validateStep1()) return
      setStep('condiciones')
    } else if (step === 'condiciones') {
      await handleCreateSolicitud()
    }
  }

  function goBack() {
    if (step === 'condiciones') setStep('cliente')
    else if (step === 'documentos') {
      // Can't go back after solicitud is created
    }
  }

  function handleFinish() {
    toast.success('Proceso completado', 'La solicitud ha sido registrada exitosamente')
    onCreated()
    handleClose()
  }

  /* ── Step index ── */
  const stepIdx = STEPS.findIndex((s) => s.key === step)

  /* ── Render ── */
  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={false}
      title="Nueva Solicitud de Crédito"
      description={`Paso ${stepIdx + 1} de ${STEPS.length} — ${STEPS[stepIdx]?.label}`}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: 'var(--sp-3)', width: '100%', justifyContent: 'space-between' }}>
          <div>
            {step !== 'cliente' && step !== 'documentos' && (
              <Button variant="ghost" onClick={goBack} icon={<ArrowLeft size={14} />}>
                Atrás
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            {step === 'documentos' ? (
              <Button variant="primary" onClick={handleFinish} icon={<CheckCircle size={14} />}>
                Finalizar
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={goNext}
                loading={submitting}
                iconRight={<ArrowRight size={14} />}
                data-onboarding="modal-siguiente"
              >
                {step === 'condiciones' ? 'Crear Solicitud' : 'Siguiente'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Step indicators */}
      <div className="cm-steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = s.key === step
          const isDone = i < stepIdx
          return (
            <div key={s.key} className={`cm-step ${isActive ? 'cm-step--active' : ''} ${isDone ? 'cm-step--done' : ''}`}>
              <div className="cm-step__circle">
                {isDone ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              <span className="cm-step__label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="cm-step__line" />}
            </div>
          )
        })}
      </div>

      {/* ─── STEP 1: CLIENTE ─── */}
      {step === 'cliente' && (
        <div className="cm-form-section animate-in" data-onboarding="dni-search">
          <h3 className="cm-form-section__title">Buscar Cliente por DNI</h3>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="DNI"
                placeholder="Ingresa 8 dígitos"
                value={dniSearch}
                onChange={(e) => {
                  setDniSearch(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setErrors({})
                }}
                error={errors.dni}
                icon={<Search size={14} />}
                maxLength={8}
              />
            </div>
            <Button
              variant="primary"
              onClick={searchByDni}
              loading={searching}
              disabled={dniSearch.length !== 8}
              style={{ marginBottom: errors.dni ? '22px' : '0' }}
            >
              Buscar
            </Button>
          </div>

          {/* Cliente found card */}
          {clienteFound && (
            <div className="cm-client-card animate-in">
              <div className="cm-client-card__badge">
                {clienteFound.es_cliente_recurrente ? (
                  <span style={{ color: 'var(--color-accent)' }}>● Cliente Recurrente</span>
                ) : (
                  <span style={{ color: 'var(--color-text-3)' }}>● Cliente Nuevo</span>
                )}
                {clienteFound.calificacion_interna && (
                  <span className="cm-client-card__rating">{clienteFound.calificacion_interna}</span>
                )}
              </div>
              <div className="cm-client-card__name">{clienteFound.nombre_completo}</div>
              <div className="cm-client-card__details">
                <span><User size={12} /> {clienteFound.dni}</span>
                {clienteFound.telefono && <span><Phone size={12} /> {clienteFound.telefono}</span>}
                {clienteFound.direccion && <span><MapPin size={12} /> {clienteFound.direccion}</span>}
                {clienteFound.zona?.nombre && <span>📍 {clienteFound.zona.nombre}</span>}
              </div>
            </div>
          )}

          {/* Not found — offer to create */}
          {clienteNotFound && !isNewCliente && (
            <div className="cm-client-notfound animate-in">
              <UserPlus size={24} style={{ color: 'var(--color-warning)' }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-text-1)' }}>Cliente no encontrado</p>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
                  No existe un cliente con DNI {dniSearch}. ¿Deseas registrarlo?
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={startNewCliente} icon={<UserPlus size={14} />}>
                Registrar Cliente
              </Button>
            </div>
          )}

          {/* New cliente form */}
          {isNewCliente && (
            <div className="cm-new-client-form animate-in">
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-4)' }}>
                Nuevo Cliente — DNI: {dniSearch}
              </h4>
              <div className="cm-form-grid">
                <Input
                  label="Nombre Completo *"
                  placeholder="Nombres y Apellidos"
                  value={newCliente.nombre_completo}
                  onChange={(e) => setNewCliente((p) => ({ ...p, nombre_completo: e.target.value }))}
                  error={errors.nombre}
                />
                <Input
                  label="Teléfono *"
                  placeholder="999 888 777"
                  value={newCliente.telefono}
                  onChange={(e) => setNewCliente((p) => ({ ...p, telefono: e.target.value }))}
                  error={errors.telefono}
                  icon={<Phone size={14} />}
                />
                <Input
                  label="Dirección"
                  placeholder="Av. Los Olivos 123"
                  value={newCliente.direccion}
                  onChange={(e) => setNewCliente((p) => ({ ...p, direccion: e.target.value }))}
                  icon={<MapPin size={14} />}
                />
                <Input
                  label="Referencia"
                  placeholder="Frente al parque, casa verde"
                  value={newCliente.referencia_direccion}
                  onChange={(e) => setNewCliente((p) => ({ ...p, referencia_direccion: e.target.value }))}
                />
                <Select
                  label="Zona"
                  options={zonas.map((z) => ({ value: z.id, label: z.nombre }))}
                  value={newCliente.zona_id}
                  onChange={(e) => setNewCliente((p) => ({ ...p, zona_id: e.target.value }))}
                  placeholder="Seleccionar zona"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 2: CONDICIONES ─── */}
      {step === 'condiciones' && (
        <div className="cm-form-section animate-in" data-onboarding="condiciones-form">
          <h3 className="cm-form-section__title">Condiciones del Préstamo</h3>

          {/* Selected client reminder */}
          {clienteFound && (
            <div className="cm-client-reminder">
              <User size={14} />
              <span><strong>{clienteFound.nombre_completo}</strong> — DNI: {clienteFound.dni}</span>
            </div>
          )}

          <div className="cm-form-grid">
            <Input
              label="Monto Solicitado (S/) *"
              type="number"
              placeholder="1,500"
              value={condiciones.monto_solicitado}
              onChange={(e) => {
                setCondiciones((p) => ({ ...p, monto_solicitado: e.target.value }))
                setErrors({})
              }}
              error={errors.monto}
              icon={<DollarSign size={14} />}
              min={100}
              max={50000}
              step={100}
            />
            <Select
              label="Plazo *"
              options={PLAZO_OPTIONS}
              value={condiciones.plazo_dias}
              onChange={(e) => setCondiciones((p) => ({ ...p, plazo_dias: e.target.value }))}
            />
            <Input
              label="Tasa de Interés (%) *"
              type="number"
              value={condiciones.tasa_interes}
              onChange={(e) => setCondiciones((p) => ({ ...p, tasa_interes: e.target.value }))}
              min={1}
              max={100}
              step={0.5}
            />
            <Select
              label="Tipo de Cronograma *"
              options={TIPO_CRONOGRAMA_OPTIONS}
              value={condiciones.tipo_cronograma}
              onChange={(e) => setCondiciones((p) => ({ ...p, tipo_cronograma: e.target.value }))}
            />
          </div>

          {/* Renovación toggle */}
          <label className="cm-toggle" style={{ marginTop: 'var(--sp-4)' }}>
            <input
              type="checkbox"
              checked={condiciones.es_renovacion}
              onChange={(e) => setCondiciones((p) => ({ ...p, es_renovacion: e.target.checked }))}
            />
            <span className="cm-toggle__track" />
            <span className="cm-toggle__label">Es renovación de préstamo anterior</span>
          </label>

          {/* Summary preview */}
          {condiciones.monto_solicitado && (
            <div className="cm-loan-preview animate-in">
              <div className="cm-loan-preview__row">
                <span>Capital</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  S/ {parseFloat(condiciones.monto_solicitado || '0').toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cm-loan-preview__row">
                <span>Interés ({condiciones.tasa_interes}%)</span>
                <span style={{ fontFamily: 'var(--font-display)' }}>
                  S/ {(parseFloat(condiciones.monto_solicitado || '0') * parseFloat(condiciones.tasa_interes || '0') / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cm-loan-preview__row cm-loan-preview__row--total">
                <span>Total a Pagar</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-accent)' }}>
                  S/ {(parseFloat(condiciones.monto_solicitado || '0') * (1 + parseFloat(condiciones.tasa_interes || '0') / 100)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cm-loan-preview__row">
                <span>Cuota diaria aprox.</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)' }}>
                  S/ {(parseFloat(condiciones.monto_solicitado || '0') * (1 + parseFloat(condiciones.tasa_interes || '0') / 100) / parseInt(condiciones.plazo_dias || '30')).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 3: DOCUMENTOS ─── */}
      {step === 'documentos' && solicitudId && (
        <div className="cm-form-section animate-in" data-onboarding="doc-uploader">
          <h3 className="cm-form-section__title">Subir Documentos del Expediente</h3>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', marginBottom: 'var(--sp-4)' }}>
            Sube los documentos requeridos. Los obligatorios están marcados con <span style={{ color: 'var(--color-danger)' }}>*</span>
          </p>
          <DocumentUploader
            solicitudId={solicitudId}
            onUploadsChange={setUploadedDocs}
          />
        </div>
      )}
    </Modal>
  )
}
