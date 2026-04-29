import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Calendar, Banknote, Users, Play, CheckCircle,
  Clock, AlertTriangle, RefreshCw,
  Phone, DollarSign,
} from 'lucide-react'
import {
  Breadcrumb, Badge, statusVariant, Button, Avatar, Skeleton, Modal, Input, Select,
} from '@/components/ui'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useRutaDetalle } from '@/hooks/useRutas'
import type { RutaCliente, MedioPago } from '@/types/cobranza'

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateFmt = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

const visitaConfig: Record<string, { color: string; bg: string; label: string }> = {
  PENDIENTE:     { color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)',  label: 'Pendiente' },
  VISITADO:      { color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', label: 'Visitado' },
  COBRADO:       { color: '#00E5A0', bg: 'rgba(0,229,160,0.1)',   label: 'Cobrado' },
  PAGO_PARCIAL:  { color: '#FFB547', bg: 'rgba(255,181,71,0.1)',  label: 'Parcial' },
  AUSENTE:       { color: '#FF5C5C', bg: 'rgba(255,92,92,0.1)',   label: 'Ausente' },
  SIN_DINERO:    { color: '#FF5C5C', bg: 'rgba(255,92,92,0.1)',   label: 'Sin Dinero' },
}

const prioridadStyle: Record<string, { color: string; label: string }> = {
  NORMAL:  { color: 'var(--color-text-3)', label: '' },
  ALTA:    { color: '#FFB547', label: '⚡ Alta' },
  URGENTE: { color: '#FF5C5C', label: '🔴 Urgente' },
}

export default function RutaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    ruta, clientes, loading, error, refetch,
    iniciarRuta, cerrarRuta, solicitarCustodia, registrarPago, marcarVisitaFallida,
  } = useRutaDetalle(id)

  const [payingClient, setPayingClient] = useState<RutaCliente | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [voucherUrl, setVoucherUrl] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--sp-5)' }}>
        <Skeleton width="200px" height="24px" />
        <Skeleton width="100%" height="120px" style={{ marginTop: 'var(--sp-4)' }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height="80px" style={{ marginTop: 'var(--sp-3)' }} />
        ))}
      </div>
    )
  }

  if (error || !ruta) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--sp-5)', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-danger)', marginBottom: 'var(--sp-3)' }} />
        <h2 style={{ color: 'var(--color-text-1)' }}>Error al cargar la ruta</h2>
        <p style={{ color: 'var(--color-text-3)' }}>{error ?? 'Ruta no encontrada'}</p>
        <Button variant="ghost" onClick={() => navigate('/cobranza')} style={{ marginTop: 'var(--sp-3)' }}>
          Volver a Cobranza
        </Button>
      </div>
    )
  }

  // Stats
  const totalEsperado = clientes.reduce((s, c) => s + (c.monto_esperado ?? 0), 0)
  const totalCobrado = clientes.reduce((s, c) => s + c.monto_cobrado, 0)
  const pendientes = clientes.filter((c) => c.estado_visita === 'PENDIENTE').length
  const visitados = clientes.filter((c) => c.estado_visita !== 'PENDIENTE').length

  async function handleIniciar() {
    setActionLoading(true)
    const { error } = await iniciarRuta()
    setActionLoading(false)
    if (error) toast.error(error)
    else toast.success('Ruta iniciada')
  }

  async function handleCerrar() {
    if (!voucherUrl.trim()) { toast.warning('Ingresa la URL del voucher de depósito'); return }
    setActionLoading(true)
    const { error } = await cerrarRuta(voucherUrl)
    setActionLoading(false)
    if (error) toast.error(error)
    else { toast.success('Ruta cerrada exitosamente'); setShowCloseModal(false) }
  }

  async function handleCustodia() {
    if (!user?.id) return
    setActionLoading(true)
    const { error } = await solicitarCustodia(user.id)
    setActionLoading(false)
    if (error) toast.error(error)
    else toast.success('Cierre con custodia registrado')
  }

  async function handleVisitaFallida(rc: RutaCliente, estado: 'AUSENTE' | 'SIN_DINERO') {
    const { error } = await marcarVisitaFallida(rc.id, estado)
    if (error) toast.error(error)
    else toast.success(`Marcado como ${estado.replace('_', ' ').toLowerCase()}`)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-in">
      {/* Breadcrumb + Back */}
      <Breadcrumb items={[
        { label: 'Cobranza', href: '/cobranza' },
        { label: `Ruta ${dateFmt(ruta.fecha_ruta)}` },
      ]} />

      {/* Header Card */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)', marginTop: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
            <Avatar name={ruta.cobrador?.nombre_completo ?? '?'} size="lg" />
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', margin: 0 }}>
                {ruta.cobrador?.nombre_completo ?? '—'}
              </h1>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-1)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
                  <MapPin size={12} /> {ruta.zona?.nombre ?? '—'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
                  <Calendar size={12} /> {dateFmt(ruta.fecha_ruta)}
                </span>
              </div>
              <div style={{ marginTop: 'var(--sp-2)' }}>
                <Badge variant={statusVariant(ruta.estado)} dot>
                  {ruta.estado.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch}>
              Actualizar
            </Button>
            {ruta.estado === 'PLANIFICADA' && (
              <Button size="sm" icon={<Play size={14} />} onClick={handleIniciar} disabled={actionLoading}>
                Iniciar Ruta
              </Button>
            )}
            {ruta.estado === 'EN_CURSO' && (
              <>
                <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => setShowCloseModal(true)}>
                  Cerrar Ruta
                </Button>
                <Button variant="ghost" size="sm" icon={<AlertTriangle size={14} />} onClick={handleCustodia} disabled={actionLoading}>
                  Custodia
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-3)', marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--color-border)' }}>
          {[
            { label: 'Clientes', value: String(clientes.length), icon: <Users size={16} />, color: '#5B8DEF' },
            { label: 'Visitados', value: `${visitados}/${clientes.length}`, icon: <CheckCircle size={16} />, color: '#00E5A0' },
            { label: 'Pendientes', value: String(pendientes), icon: <Clock size={16} />, color: '#FFB547' },
            { label: 'Esperado', value: fmt(totalEsperado), icon: <DollarSign size={16} />, color: '#A78BFA' },
            { label: 'Cobrado', value: fmt(totalCobrado), icon: <Banknote size={16} />, color: '#00E5A0' },
            { label: 'Efectivo', value: fmt(ruta.saldo_mano), icon: <Banknote size={16} />, color: ruta.saldo_mano > 2000 ? '#FF5C5C' : '#FFB547' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: '2px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--color-text-1)' }}>{s.value}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cash warning */}
      {ruta.saldo_mano > 2000 && (
        <div style={{ padding: 'var(--sp-3) var(--sp-4)', background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <AlertTriangle size={16} style={{ color: '#FF5C5C', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--fs-sm)', color: '#FF5C5C', fontWeight: 600 }}>
            ⚠ Efectivo en mano ({fmt(ruta.saldo_mano)}) excede el límite de S/ 2,000. Se requiere depósito parcial.
          </span>
        </div>
      )}

      {/* Client List */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-3)' }}>
        Lista de Clientes ({clientes.length})
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {clientes.map((rc) => {
          const vc = visitaConfig[rc.estado_visita] ?? visitaConfig.PENDIENTE
          const prio = prioridadStyle[rc.prioridad] ?? prioridadStyle.NORMAL
          const isDone = ['COBRADO', 'AUSENTE', 'SIN_DINERO'].includes(rc.estado_visita)

          return (
            <div key={rc.id} className="glass-card" style={{ padding: 'var(--sp-4)', opacity: isDone ? 0.7 : 1, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                {/* Client info */}
                <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={rc.cliente?.nombre_completo ?? '?'} src={rc.cliente?.foto_url} size="md" />
                    <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-2)', border: '2px solid var(--color-surface-1)' }}>
                      {rc.orden_visita}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-1)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      {rc.cliente?.nombre_completo ?? '—'}
                      {prio.label && <span style={{ fontSize: 'var(--fs-xs)', color: prio.color }}>{prio.label}</span>}
                    </div>
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
                      DNI: {rc.cliente?.dni ?? '—'}
                      {rc.cliente?.telefono && <> · <Phone size={10} style={{ verticalAlign: 'middle' }} /> {rc.cliente.telefono}</>}
                    </div>
                    {rc.instruccion_especial && (
                      <div style={{ fontSize: 'var(--fs-xs)', color: '#FFB547', marginTop: '2px', fontStyle: 'italic' }}>
                        📋 {rc.instruccion_especial}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial info */}
                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Esperado</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-1)' }}>
                    {fmt(rc.monto_esperado ?? 0)}
                  </div>
                  {rc.monto_cobrado > 0 && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '4px' }}>Cobrado</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#00E5A0' }}>
                        {fmt(rc.monto_cobrado)}
                      </div>
                    </>
                  )}
                  <div style={{ marginTop: 'var(--sp-2)' }}>
                    <Badge variant={statusVariant(rc.estado_visita)} dot>{vc.label}</Badge>
                  </div>
                </div>

                {/* Actions */}
                {ruta.estado === 'EN_CURSO' && !isDone && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', minWidth: '120px' }}>
                    <Button size="sm" onClick={() => setPayingClient(rc)}>
                      <Banknote size={12} /> Cobrar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleVisitaFallida(rc, 'AUSENTE')}>
                      Ausente
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleVisitaFallida(rc, 'SIN_DINERO')}>
                      Sin Dinero
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {clientes.length === 0 && (
          <div className="glass-card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--color-text-3)', marginBottom: 'var(--sp-2)' }} />
            <p style={{ color: 'var(--color-text-2)', fontWeight: 500 }}>No hay clientes asignados a esta ruta</p>
            <p style={{ color: 'var(--color-text-3)', fontSize: 'var(--fs-sm)' }}>Asigna clientes desde el módulo de préstamos</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payingClient && (
        <PagoModal
          rutaCliente={payingClient}
          cobradorId={ruta.cobrador_id}
          onClose={() => setPayingClient(null)}
          onSubmit={async (form) => {
            const { error } = await registrarPago(form)
            if (error) toast.error(error)
            else { toast.success('Pago registrado exitosamente'); setPayingClient(null) }
          }}
        />
      )}

      {/* Close Route Modal */}
      {showCloseModal && (
        <Modal open={true} title="Cerrar Ruta" onClose={() => setShowCloseModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--fs-sm)' }}>
              Ingresa la URL del voucher de depósito bancario para cerrar la ruta.
            </p>
            <Input
              placeholder="URL del voucher de depósito..."
              value={voucherUrl}
              onChange={(e) => setVoucherUrl(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <Button variant="ghost" size="sm" onClick={() => setShowCloseModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCerrar} disabled={actionLoading}>
                {actionLoading ? 'Cerrando...' : 'Cerrar Ruta'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ── Payment Modal ── */

function PagoModal({ rutaCliente, cobradorId, onClose, onSubmit }: {
  rutaCliente: RutaCliente
  cobradorId: string
  onClose: () => void
  onSubmit: (form: import('@/types/cobranza').NuevoPagoForm) => Promise<void>
}) {
  const [monto, setMonto] = useState(String(rutaCliente.monto_esperado ?? 0))
  const [medioPago, setMedioPago] = useState<MedioPago>('EFECTIVO')
  const [numOperacion, setNumOperacion] = useState('')
  const [bancoOrigen, setBancoOrigen] = useState('')
  const [saving, setSaving] = useState(false)

  const isDigital = medioPago !== 'EFECTIVO'

  async function handleSubmit() {
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) { toast.warning('Monto inválido'); return }
    if (isDigital && !numOperacion.trim()) { toast.warning('Ingresa el número de operación'); return }

    setSaving(true)
    await onSubmit({
      prestamo_id: rutaCliente.prestamo_id,
      cliente_id: rutaCliente.cliente_id,
      ruta_cliente_id: rutaCliente.id,
      cobrador_id: cobradorId,
      monto: Math.round(montoNum * 100) / 100,
      medio_pago: medioPago,
      numero_operacion: numOperacion || undefined,
      banco_origen: bancoOrigen || undefined,
    })
    setSaving(false)
  }

  return (
    <Modal open={true} title={`Cobrar a ${rutaCliente.cliente?.nombre_completo ?? '—'}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {/* Loan context */}
        <div style={{ padding: 'var(--sp-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-3)' }}>Saldo pendiente:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-1)' }}>
              {fmt(rutaCliente.prestamo?.saldo_pendiente ?? 0)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: 'var(--color-text-3)' }}>Cuota esperada:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#FFB547' }}>
              {fmt(rutaCliente.monto_esperado ?? 0)}
            </span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>Monto</label>
          <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} step="0.01" min="0" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>Medio de Pago</label>
          <Select
            options={[
              { value: 'EFECTIVO', label: '💵 Efectivo' },
              { value: 'YAPE', label: '📱 Yape' },
              { value: 'PLIN', label: '📱 Plin' },
              { value: 'TRANSFERENCIA_BANCARIA', label: '🏦 Transferencia' },
            ]}
            value={medioPago}
            onChange={(e) => setMedioPago(e.target.value as MedioPago)}
          />
        </div>

        {isDigital && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>Nº Operación</label>
              <Input value={numOperacion} onChange={(e) => setNumOperacion(e.target.value)} placeholder="Número de operación..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--sp-1)' }}>Banco</label>
              <Select
                options={[
                  { value: '', label: 'Seleccionar banco...' },
                  { value: 'BCP', label: 'BCP' },
                  { value: 'INTERBANK', label: 'Interbank' },
                  { value: 'BBVA', label: 'BBVA' },
                  { value: 'SCOTIABANK', label: 'Scotiabank' },
                  { value: 'BN', label: 'Banco de la Nación' },
                  { value: 'OTRO', label: 'Otro' },
                ]}
                value={bancoOrigen}
                onChange={(e) => setBancoOrigen(e.target.value)}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Registrando...' : `Registrar ${medioPago === 'EFECTIVO' ? 'Efectivo' : 'Pago Digital'}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
