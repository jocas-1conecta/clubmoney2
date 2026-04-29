import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  MapPin,
  IdCard,
  Calendar,
  DollarSign,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
  Eye,
  Send,
  Image,
  ArrowRightCircle,
  Banknote,
  CreditCard,
  Building2,
  Stamp,
  Download,
  X,
  ZoomIn,
  ExternalLink,
} from 'lucide-react'
import {
  Breadcrumb,
  Badge,
  statusVariant,
  Button,
  Tabs,
  Avatar,
  Skeleton,
  Input,
  Select,
} from '@/components/ui'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useSolicitudDetalle } from '@/hooks/useSolicitudDetalle'
import type { RevisionSupervisor, DocumentoSolicitud } from '@/hooks/useSolicitudDetalle'
import { useFormalizacion } from '@/hooks/useFormalizacion'

/* ─── Formatters ──────────────────────────────────────────── */

const fmt = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const dateFmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const dateTimeFmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const estadoConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  INGRESADA: { color: '#5B8DEF', bg: 'rgba(91,141,239,0.1)', icon: <FileText size={16} />, label: 'Ingresada' },
  EN_EVALUACION: { color: '#FFB547', bg: 'rgba(255,181,71,0.1)', icon: <Eye size={16} />, label: 'En Evaluación' },
  VERIFICACION_CAMPO: { color: '#C084FC', bg: 'rgba(192,132,252,0.1)', icon: <MapPin size={16} />, label: 'Verificación Campo' },
  APROBADA: { color: '#00E5A0', bg: 'rgba(0,229,160,0.1)', icon: <CheckCircle size={16} />, label: 'Aprobada' },
  RECHAZADA: { color: '#FF5C5C', bg: 'rgba(255,92,92,0.1)', icon: <XCircle size={16} />, label: 'Rechazada' },
  OBSERVADA: { color: '#FFB547', bg: 'rgba(255,181,71,0.1)', icon: <AlertTriangle size={16} />, label: 'Observada' },
  EN_FORMALIZACION: { color: '#00E5A0', bg: 'rgba(0,229,160,0.1)', icon: <ArrowRightCircle size={16} />, label: 'En Formalización' },
}

/* ─── Main Page ───────────────────────────────────────────── */

export default function SolicitudDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { solicitud, loading, error, refetch, emitirDictamen, cambiarEstado } = useSolicitudDetalle(id)

  const canReview = hasRole('SUPERVISOR') || hasRole('GERENCIA')

  if (loading) return <DetailSkeleton />

  if (error || !solicitud) {
    return (
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: 'var(--sp-6) 0' }}>
        <div className="glass-card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <XCircle size={40} style={{ color: 'var(--color-danger)', margin: '0 auto var(--sp-4)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', color: 'var(--color-text-1)', marginBottom: 'var(--sp-2)' }}>
            Solicitud no encontrada
          </h2>
          <p style={{ color: 'var(--color-text-3)', marginBottom: 'var(--sp-6)' }}>{error ?? 'No se pudo cargar la solicitud.'}</p>
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/solicitudes')}>Volver</Button>
        </div>
      </div>
    )
  }

  const est = estadoConfig[solicitud.estado] ?? estadoConfig.INGRESADA
  const interes = solicitud.monto_solicitado * (solicitud.tasa_interes / 100)
  const total = solicitud.monto_solicitado + interes

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="animate-in">
      <Breadcrumb items={[
        { label: 'Solicitudes', href: '/solicitudes' },
        { label: `${solicitud.cliente?.nombre_completo ?? 'Solicitud'}` },
      ]} />

      {/* ═══ HEADER ═══ */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)', marginTop: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-5)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Avatar name={solicitud.cliente?.nombre_completo ?? '?'} src={solicitud.cliente?.foto_url} size="lg" />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-1)' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text-1)' }}>
                {solicitud.cliente?.nombre_completo ?? 'N/A'}
              </h1>
              <Badge variant={statusVariant(solicitud.estado)} dot>{est.label}</Badge>
              {solicitud.es_renovacion && <Badge variant="warning">Renovación</Badge>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)', fontSize: 'var(--fs-base)', color: 'var(--color-text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IdCard size={13} /> {solicitud.cliente?.dni ?? '—'}</span>
              {solicitud.cliente?.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {solicitud.cliente.telefono}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} /> {dateFmt(solicitud.created_at)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={13} /> Asesor: {solicitud.asesor?.nombre_completo ?? '—'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', alignSelf: 'flex-start' }}>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetch} />
            {canReview && solicitud.estado === 'INGRESADA' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Eye size={14} />}
                onClick={async () => {
                  try {
                    await cambiarEstado('EN_EVALUACION')
                    toast.success('Estado actualizado', 'Solicitud en evaluación')
                  } catch { toast.error('Error', 'No se pudo cambiar el estado') }
                }}
              >
                Iniciar Evaluación
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        <MiniStat icon={<DollarSign size={20} />} iconBg="rgba(91,141,239,0.12)" iconColor="#5B8DEF" label="Monto Solicitado" value={fmt(solicitud.monto_solicitado)} />
        <MiniStat icon={<Clock size={20} />} iconBg="rgba(192,132,252,0.12)" iconColor="#C084FC" label="Plazo" value={`${solicitud.plazo_dias} días`} />
        <MiniStat icon={<AlertTriangle size={20} />} iconBg="rgba(255,181,71,0.12)" iconColor="#FFB547" label={`Interés (${solicitud.tasa_interes}%)`} value={fmt(interes)} />
        <MiniStat icon={<CheckCircle size={20} />} iconBg="rgba(0,229,160,0.12)" iconColor="#00E5A0" label="Total a Pagar" value={fmt(total)} />
      </div>

      {/* ═══ TABS ═══ */}
      <Tabs
        tabs={[
          { id: 'resumen', label: 'Resumen', icon: <FileText size={14} /> },
          { id: 'documentos', label: 'Documentos', icon: <Image size={14} />, badge: solicitud.documentos?.length ?? 0 },
          { id: 'dictamen', label: 'Dictamen', icon: <Shield size={14} />, badge: solicitud.revisiones?.length ?? 0 },
          ...(['EN_FORMALIZACION', 'DESEMBOLSADA', 'ACTIVA'].includes(solicitud.estado)
            ? [{ id: 'formalizacion', label: 'Formalización', icon: <Stamp size={14} />, onboardingId: 'tab-formalizacion' }]
            : []),
        ]}
      >
        {(tab) => {
          if (tab === 'resumen') return <ResumenTab solicitud={solicitud} />
          if (tab === 'documentos') return <DocumentosTab documentos={solicitud.documentos ?? []} />
          if (tab === 'dictamen') return (
            <DictamenTab
              revisiones={solicitud.revisiones ?? []}
              canReview={canReview}
              estado={solicitud.estado}
              solicitud={solicitud}
              onEmitirDictamen={emitirDictamen}
            />
          )
          if (tab === 'formalizacion') return (
            <FormalizacionTab
              solicitudId={id!}
              solicitud={solicitud}
              canTesoreria={hasRole('TESORERIA') || hasRole('GERENCIA')}
            />
          )
          return null
        }}
      </Tabs>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────────── */

function MiniStat({ icon, iconBg, iconColor, label, value }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string
}) {
  return (
    <div className="glass-card" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg, color: iconColor, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}>{value}</div>
        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)' }}>{label}</div>
      </div>
    </div>
  )
}

function ResumenTab({ solicitud }: { solicitud: ReturnType<typeof useSolicitudDetalle>['solicitud'] & object }) {
  const items = [
    { label: 'Tipo Cronograma', value: solicitud.tipo_cronograma, icon: <Calendar size={14} /> },
    { label: 'Es Renovación', value: solicitud.es_renovacion ? 'Sí' : 'No', icon: <RefreshCw size={14} /> },
    { label: 'Requiere Verificación', value: solicitud.requiere_verificacion_campo ? 'Sí' : 'No', icon: <MapPin size={14} /> },
    { label: 'Validación Biométrica', value: solicitud.validacion_biometrica_ok ? '✅ Verificado' : '⏳ Pendiente', icon: <Shield size={14} /> },
    { label: 'Motivo de Rechazo', value: solicitud.motivo_rechazo, icon: <XCircle size={14} /> },
    { label: 'Creada', value: dateTimeFmt(solicitud.created_at), icon: <Clock size={14} /> },
    { label: 'Última Actualización', value: dateTimeFmt(solicitud.updated_at), icon: <Clock size={14} /> },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
      {/* Left — Info items */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderBottom: i < items.length - 1 ? '1px solid var(--color-border-1)' : 'none',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
              {item.icon} {item.label}
            </span>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: item.value ? 'var(--color-text-1)' : 'var(--color-text-3)' }}>
              {item.value ?? '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Right — Seeker / Risk */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-4)' }}>
          Central de Riesgos
        </h3>
        {solicitud.seeker ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: (solicitud.seeker.score ?? 0) >= 600 ? 'rgba(0,229,160,0.1)' : 'rgba(255,92,92,0.1)',
                border: `2px solid ${(solicitud.seeker.score ?? 0) >= 600 ? '#00E5A0' : '#FF5C5C'}`,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: (solicitud.seeker.score ?? 0) >= 600 ? '#00E5A0' : '#FF5C5C' }}>
                  {solicitud.seeker.score ?? '—'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-1)' }}>Score Crediticio</div>
                <Badge variant={(solicitud.seeker.score ?? 0) >= 600 ? 'success' : 'danger'}>
                  {(solicitud.seeker.score ?? 0) >= 600 ? 'Apto' : 'Riesgo Alto'}
                </Badge>
              </div>
            </div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>
              Consultado: {dateTimeFmt(solicitud.seeker.fecha_consulta)} · Estado: {solicitud.seeker.estado}
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0', color: 'var(--color-text-3)' }}>
            <Shield size={32} style={{ margin: '0 auto var(--sp-3)', opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>Consulta Seeker no realizada</p>
            <p style={{ fontSize: 'var(--fs-xs)', marginTop: 'var(--sp-1)' }}>Se requiere integración con API externa</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentosTab({ documentos }: { documentos: DocumentoSolicitud[] }) {
  const [previewDoc, setPreviewDoc] = useState<DocumentoSolicitud | null>(null)

  if (documentos.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <Image size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto var(--sp-3)' }} />
        <p style={{ color: 'var(--color-text-3)', fontSize: 'var(--fs-sm)' }}>No se han subido documentos para esta solicitud.</p>
      </div>
    )
  }

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif|bmp|svg)/i.test(url)
  const isPdf = (url: string) => /\.pdf/i.test(url)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className="glass-card doc-card-clickable"
            style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', cursor: 'pointer' }}
            onClick={() => setPreviewDoc(doc)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setPreviewDoc(doc) }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
              overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isImage(doc.url_archivo) ? (
                <img src={doc.url_archivo} alt={doc.tipo_documento} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FileText size={20} style={{ color: 'var(--color-text-3)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-1)' }}>
                {doc.tipo_documento.replace(/_/g, ' ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: '2px' }}>
                <Badge variant={doc.estado_validacion === 'VALIDADO' ? 'success' : doc.estado_validacion === 'RECHAZADO' ? 'danger' : 'neutral'}>
                  {doc.estado_validacion}
                </Badge>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>{dateFmt(doc.created_at)}</span>
              </div>
            </div>
            <ZoomIn size={16} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* ═══ DOCUMENT PREVIEW LIGHTBOX (portaled to body) ═══ */}
      {previewDoc && createPortal(
        <div
          className="doc-lightbox"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewDoc(null) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setPreviewDoc(null) }}
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa: ${previewDoc.tipo_documento.replace(/_/g, ' ')}`}
        >
          {/* Header bar */}
          <div className="doc-lightbox__header">
            <div className="doc-lightbox__title">
              {previewDoc.tipo_documento.replace(/_/g, ' ')}
              <Badge
                variant={previewDoc.estado_validacion === 'VALIDADO' ? 'success' : previewDoc.estado_validacion === 'RECHAZADO' ? 'danger' : 'neutral'}
              >
                {previewDoc.estado_validacion}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <a
                href={previewDoc.url_archivo}
                target="_blank"
                rel="noopener noreferrer"
                className="doc-lightbox__action"
                title="Abrir en nueva pestaña"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={18} />
              </a>
              <a
                href={previewDoc.url_archivo}
                download
                className="doc-lightbox__action"
                title="Descargar"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={18} />
              </a>
              <button
                className="doc-lightbox__action"
                onClick={() => setPreviewDoc(null)}
                aria-label="Cerrar vista previa"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="doc-lightbox__content">
            {isImage(previewDoc.url_archivo) ? (
              <img
                src={previewDoc.url_archivo}
                alt={previewDoc.tipo_documento}
                className="doc-lightbox__image"
              />
            ) : isPdf(previewDoc.url_archivo) ? (
              <iframe
                src={previewDoc.url_archivo}
                title={previewDoc.tipo_documento}
                className="doc-lightbox__pdf"
              />
            ) : (
              <div className="doc-lightbox__fallback">
                <FileText size={48} />
                <p>Este tipo de archivo no se puede previsualizar.</p>
                <a href={previewDoc.url_archivo} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" icon={<ExternalLink size={14} />}>Abrir archivo</Button>
                </a>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function DictamenTab({ revisiones, canReview, estado, solicitud, onEmitirDictamen }: {
  revisiones: RevisionSupervisor[]
  canReview: boolean
  estado: string
  solicitud: { monto_solicitado: number; tasa_interes: number; plazo_dias: number }
  onEmitirDictamen: (data: { dictamen: 'APROBADA' | 'RECHAZADA' | 'OBSERVADA'; motivo?: string; monto_aprobado?: number; tasa_aprobada?: number; plazo_aprobado?: number; condiciones_especiales?: string }) => Promise<void>
}) {
  const [dictamen, setDictamen] = useState<'APROBADA' | 'RECHAZADA' | 'OBSERVADA'>('APROBADA')
  const [motivo, setMotivo] = useState('')
  const [montoAprobado, setMontoAprobado] = useState(String(solicitud.monto_solicitado))
  const [tasaAprobada, setTasaAprobada] = useState(String(solicitud.tasa_interes))
  const [plazoAprobado, setPlazoAprobado] = useState(String(solicitud.plazo_dias))
  const [condiciones, setCondiciones] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showForm = canReview && (estado === 'EN_EVALUACION' || estado === 'INGRESADA')

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await onEmitirDictamen({
        dictamen,
        motivo: motivo || undefined,
        monto_aprobado: dictamen === 'APROBADA' ? Number(montoAprobado) : undefined,
        tasa_aprobada: dictamen === 'APROBADA' ? Number(tasaAprobada) : undefined,
        plazo_aprobado: dictamen === 'APROBADA' ? Number(plazoAprobado) : undefined,
        condiciones_especiales: condiciones || undefined,
      })
      toast.success('Dictamen registrado', `Solicitud ${dictamen.toLowerCase()}`)
    } catch (e: unknown) {
      toast.error('Error', e instanceof Error ? e.message : 'No se pudo registrar el dictamen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {/* Dictamen form */}
      {showForm && (
        <div className="glass-card" style={{ padding: 'var(--sp-5)', border: '1px solid rgba(0,229,160,0.15)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-4)' }}>
            Emitir Dictamen
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <Select
              label="Decisión *"
              value={dictamen}
              onChange={(e) => setDictamen(e.target.value as 'APROBADA' | 'RECHAZADA' | 'OBSERVADA')}
              options={[
                { value: 'APROBADA', label: '✅ Aprobar' },
                { value: 'RECHAZADA', label: '❌ Rechazar' },
                { value: 'OBSERVADA', label: '⚠️ Observar' },
              ]}
            />
            {dictamen === 'APROBADA' && (
              <>
                <Input label="Monto Aprobado (S/)" type="number" value={montoAprobado} onChange={(e) => setMontoAprobado(e.target.value)} icon={<DollarSign size={14} />} />
                <Input label="Tasa Aprobada (%)" type="number" value={tasaAprobada} onChange={(e) => setTasaAprobada(e.target.value)} />
                <Input label="Plazo Aprobado (días)" type="number" value={plazoAprobado} onChange={(e) => setPlazoAprobado(e.target.value)} />
              </>
            )}
          </div>
          <Input
            label={dictamen === 'RECHAZADA' ? 'Motivo de Rechazo *' : dictamen === 'OBSERVADA' ? 'Observaciones *' : 'Condiciones Especiales'}
            value={dictamen === 'APROBADA' ? condiciones : motivo}
            onChange={(e) => dictamen === 'APROBADA' ? setCondiciones(e.target.value) : setMotivo(e.target.value)}
            placeholder={dictamen === 'RECHAZADA' ? 'Explique el motivo del rechazo...' : dictamen === 'OBSERVADA' ? 'Indique qué se requiere corregir...' : 'Opcional: condiciones adicionales'}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-4)' }}>
            <Button
              variant={dictamen === 'RECHAZADA' ? 'danger' : 'primary'}
              icon={<Send size={14} />}
              loading={submitting}
              onClick={handleSubmit}
              disabled={(dictamen === 'RECHAZADA' && !motivo) || (dictamen === 'OBSERVADA' && !motivo)}
            >
              Registrar Dictamen
            </Button>
          </div>
        </div>
      )}

      {/* Revision history */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-4)' }}>
          Historial de Revisiones
        </h3>
        {revisiones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0', color: 'var(--color-text-3)' }}>
            <Shield size={32} style={{ margin: '0 auto var(--sp-3)', opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>No hay revisiones registradas</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {revisiones.map((rev) => (
              <RevisionCard key={rev.id} revision={rev} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RevisionCard({ revision }: { revision: RevisionSupervisor }) {
  // DB stores masculine: APROBADO, RECHAZADO, OBSERVADO
  const d = revision.dictamen.toUpperCase()
  const isAprobado = d === 'APROBADO' || d === 'APROBADA'
  const isRechazado = d === 'RECHAZADO' || d === 'RECHAZADA'

  const dictamenColors: Record<string, { bg: string; color: string }> = {
    aprobado: { bg: 'rgba(0,229,160,0.08)', color: '#00E5A0' },
    rechazado: { bg: 'rgba(255,92,92,0.08)', color: '#FF5C5C' },
    observado: { bg: 'rgba(255,181,71,0.08)', color: '#FFB547' },
  }
  const dc = isAprobado ? dictamenColors.aprobado : isRechazado ? dictamenColors.rechazado : dictamenColors.observado

  return (
    <div style={{ padding: 'var(--sp-4)', background: dc.bg, borderRadius: 'var(--radius-md)', border: `1px solid ${dc.color}22` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Badge variant={isAprobado ? 'success' : isRechazado ? 'danger' : 'warning'} dot>
            {revision.dictamen}
          </Badge>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>
            por {revision.supervisor?.nombre_completo ?? 'Supervisor'}
          </span>
        </div>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          {dateTimeFmt(revision.created_at)}
        </span>
      </div>
      {revision.motivo && (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-2)', fontStyle: 'italic', marginBottom: 'var(--sp-2)' }}>
          "{revision.motivo}"
        </p>
      )}
      {isAprobado && (
        <div style={{ display: 'flex', gap: 'var(--sp-4)', fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', flexWrap: 'wrap' }}>
          {revision.monto_aprobado && <span>Monto: <strong style={{ color: 'var(--color-text-2)' }}>{fmt(revision.monto_aprobado)}</strong></span>}
          {revision.tasa_aprobada && <span>Tasa: <strong style={{ color: 'var(--color-text-2)' }}>{revision.tasa_aprobada}%</strong></span>}
          {revision.plazo_aprobado && <span>Plazo: <strong style={{ color: 'var(--color-text-2)' }}>{revision.plazo_aprobado} días</strong></span>}
        </div>
      )}
      {revision.condiciones_especiales && (
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: 'var(--sp-2)' }}>
          Condiciones: {revision.condiciones_especiales}
        </p>
      )}
    </div>
  )
}

/* ─── Formalización Tab ──────────────────────────────────── */

function FormalizacionTab({ solicitudId, solicitud, canTesoreria }: {
  solicitudId: string
  solicitud: {
    monto_solicitado: number; tasa_interes: number; plazo_dias: number; estado: string;
    cliente?: { nombre_completo?: string; dni?: string; direccion?: string; telefono?: string | null; foto_url?: string | null } | null;
    asesor?: { nombre_completo?: string } | null;
    tipo_cronograma?: string;
    created_at?: string;
  }
  canTesoreria: boolean
}) {
  const {
    contratos, desembolsos, pagares, prestamoId,
    loading,
    crearContrato, firmarContrato, validarContrato,
    registrarDesembolso, recibirPagare,
  } = useFormalizacion(solicitudId)

  const [desembolsoForm, setDesembolsoForm] = useState({
    medio: 'TRANSFERENCIA_BANCARIA',
    banco: '',
    cuenta: '',
    numeroOperacion: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [previewContract, setPreviewContract] = useState<{ tipo: string; id: string } | null>(null)

  const noPrestamoYet = !prestamoId && !loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

      {/* ── No Préstamo Warning ── */}
      {noPrestamoYet && (
        <div className="glass-card" style={{ padding: 'var(--sp-6)', textAlign: 'center', borderColor: 'rgba(255,181,71,0.2)' }}>
          <AlertTriangle size={32} style={{ color: '#FFB547', margin: '0 auto var(--sp-3)' }} />
          <p style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-2)' }}>
            Préstamo no generado aún
          </p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
            El préstamo debe generarse desde el proceso de aprobación para continuar con la formalización.
          </p>
        </div>
      )}

      {/* ── 1. CONTRATOS ── */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)' }} data-onboarding="seccion-contratos">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <FileText size={18} style={{ color: '#5B8DEF' }} /> Contratos
          </h3>
          {prestamoId && canTesoreria && (
            <Button
              variant="secondary"
              size="sm"
              icon={<FileText size={14} />}
              onClick={async () => {
                try {
                  await crearContrato(prestamoId, 'PAGARE')
                  toast.success('Contrato creado', 'Pagaré generado correctamente')
                } catch { toast.error('Error', 'No se pudo crear el contrato') }
              }}
            >
              Generar Pagaré
            </Button>
          )}
        </div>

        {contratos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0', color: 'var(--color-text-3)' }}>
            <FileText size={28} style={{ margin: '0 auto var(--sp-2)', opacity: 0.3 }} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>No hay contratos asociados</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {contratos.map((c) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
                background: c.estado === 'VALIDADO' ? 'rgba(0,229,160,0.06)' : c.estado === 'FIRMADO' ? 'rgba(91,141,239,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${c.estado === 'VALIDADO' ? 'rgba(0,229,160,0.15)' : 'var(--color-border-1)'}`,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
                onClick={() => setPreviewContract({ tipo: c.tipo_contrato, id: c.id })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,141,239,0.1)', color: '#5B8DEF' }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-1)' }}>
                      {c.tipo_contrato === 'PAGARE' ? 'Pagaré' : 'Contrato de Préstamo'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <Badge variant={statusVariant(c.estado)} dot>{c.estado}</Badge>
                      {c.firmado && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>Firmado: {dateFmt(c.fecha_firma)}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <Button variant="ghost" size="sm" icon={<Eye size={12} />}
                    onClick={(e) => { e.stopPropagation(); setPreviewContract({ tipo: c.tipo_contrato, id: c.id }) }}
                  >Ver</Button>
                  {!c.firmado && canTesoreria && (
                    <Button variant="secondary" size="sm" icon={<Stamp size={12} />}
                      onClick={async (e) => {
                        e.stopPropagation()
                        try { await firmarContrato(c.id); toast.success('Firmado', 'Contrato marcado como firmado') }
                        catch { toast.error('Error', 'No se pudo firmar') }
                      }}
                    >Firmar</Button>
                  )}
                  {c.firmado && !c.validado_por_tesoreria && canTesoreria && (
                    <Button variant="primary" size="sm" icon={<CheckCircle size={12} />}
                      onClick={async (e) => {
                        e.stopPropagation()
                        try { await validarContrato(c.id); toast.success('Validado', 'Contrato validado por Tesorería') }
                        catch { toast.error('Error', 'No se pudo validar') }
                      }}
                    >Validar</Button>
                  )}
                  {c.validado_por_tesoreria && (
                    <Badge variant="success">✅ Validado</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. DESEMBOLSO ── */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)', border: canTesoreria && prestamoId && desembolsos.length === 0 ? '1px solid rgba(91,141,239,0.15)' : undefined }} data-onboarding="seccion-desembolso">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Banknote size={18} style={{ color: '#00E5A0' }} /> Desembolso
        </h3>

        {desembolsos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {desembolsos.map((d) => (
              <div key={d.id} style={{
                padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)',
                background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <DollarSign size={20} style={{ color: '#00E5A0' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 700, color: '#00E5A0' }}>
                        {fmt(d.monto)}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>
                        {d.medio_desembolso.replace(/_/g, ' ')} · {d.banco_destino ?? ''} {d.cuenta_destino ? `· ****${d.cuenta_destino.slice(-4)}` : ''}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" dot>COMPLETADO</Badge>
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', display: 'flex', gap: 'var(--sp-4)' }}>
                  {d.numero_operacion && <span>Op: <strong>{d.numero_operacion}</strong></span>}
                  <span>Fecha: {dateTimeFmt(d.fecha_desembolso)}</span>
                  <span>Tesorero: {d.tesorero?.nombre_completo ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : canTesoreria && prestamoId ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <Select
                label="Medio de Desembolso"
                value={desembolsoForm.medio}
                onChange={(e) => setDesembolsoForm(prev => ({ ...prev, medio: e.target.value }))}
                options={[
                  { value: 'TRANSFERENCIA_BANCARIA', label: '🏦 Transferencia Bancaria' },
                  { value: 'EFECTIVO', label: '💵 Efectivo' },
                ]}
              />
              {desembolsoForm.medio === 'TRANSFERENCIA_BANCARIA' && (
                <>
                  <Input label="Banco Destino" value={desembolsoForm.banco}
                    onChange={(e) => setDesembolsoForm(prev => ({ ...prev, banco: e.target.value }))}
                    icon={<Building2 size={14} />} placeholder="BCP, Interbank..."
                  />
                  <Input label="Cuenta Destino" value={desembolsoForm.cuenta}
                    onChange={(e) => setDesembolsoForm(prev => ({ ...prev, cuenta: e.target.value }))}
                    icon={<CreditCard size={14} />} placeholder="191-xxx-xxx"
                  />
                </>
              )}
              <Input label="N° Operación" value={desembolsoForm.numeroOperacion}
                onChange={(e) => setDesembolsoForm(prev => ({ ...prev, numeroOperacion: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
                Monto a desembolsar: <strong style={{ color: 'var(--color-text-1)', fontSize: 'var(--fs-lg)' }}>{fmt(solicitud.monto_solicitado)}</strong>
              </div>
              <Button
                variant="primary"
                icon={<Send size={14} />}
                loading={submitting}
                onClick={async () => {
                  setSubmitting(true)
                  try {
                    await registrarDesembolso({
                      prestamoId: prestamoId!,
                      monto: solicitud.monto_solicitado,
                      medio: desembolsoForm.medio,
                      banco: desembolsoForm.banco || undefined,
                      cuenta: desembolsoForm.cuenta || undefined,
                      numeroOperacion: desembolsoForm.numeroOperacion || undefined,
                    })
                    toast.success('Desembolso registrado', `${fmt(solicitud.monto_solicitado)} desembolsado`)
                  } catch (e: unknown) {
                    toast.error('Error', e instanceof Error ? e.message : 'No se pudo registrar')
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                Registrar Desembolso
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0', color: 'var(--color-text-3)' }}>
            <Banknote size={28} style={{ margin: '0 auto var(--sp-2)', opacity: 0.3 }} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>
              {prestamoId ? 'No se ha registrado desembolso' : 'Pendiente generación de préstamo'}
            </p>
          </div>
        )}
      </div>

      {/* ── 3. PAGARÉS ── */}
      <div className="glass-card" style={{ padding: 'var(--sp-5)' }} data-onboarding="seccion-pagares">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Download size={18} style={{ color: '#C084FC' }} /> Recepción de Pagarés
        </h3>

        {pagares.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0', color: 'var(--color-text-3)' }}>
            <Shield size={28} style={{ margin: '0 auto var(--sp-2)', opacity: 0.3 }} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>No hay pagarés registrados para este préstamo</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {pagares.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
                background: p.recibido ? 'rgba(0,229,160,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${p.recibido ? 'rgba(0,229,160,0.15)' : 'var(--color-border-1)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: p.recibido ? 'rgba(0,229,160,0.1)' : 'rgba(192,132,252,0.1)',
                    color: p.recibido ? '#00E5A0' : '#C084FC',
                  }}>
                    {p.recibido ? <CheckCircle size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--color-text-1)' }}>
                      Pagaré — {p.asesor?.nombre_completo ?? 'Asesor'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <Badge variant={statusVariant(p.estado)} dot>{p.estado}</Badge>
                      {p.fecha_recepcion && (
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)' }}>
                          Recibido: {dateFmt(p.fecha_recepcion)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!p.recibido && (
                  <Button variant="primary" size="sm" icon={<CheckCircle size={12} />}
                    onClick={async () => {
                      try { await recibirPagare(p.id); toast.success('Recibido', 'Pagaré marcado como recibido') }
                      catch { toast.error('Error', 'No se pudo actualizar') }
                    }}
                  >Confirmar Recepción</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ── CONTRACT PREVIEW MODAL ── */}
      {previewContract && createPortal(
        <div className="cm-modal-overlay" onClick={() => setPreviewContract(null)}>
          <div className="cm-modal" style={{ maxWidth: '720px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--color-border-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--color-text-1)' }}>
                {previewContract.tipo === 'PAGARE' ? '📄 Pagaré' : '📋 Contrato de Préstamo'}
              </h3>
              <button onClick={() => setPreviewContract(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* ── Document Body ── */}
            <div style={{
              padding: 'var(--sp-6)', background: '#fafafa', color: '#1a1a2e',
              fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '13px', lineHeight: '1.7',
            }}>
              {previewContract.tipo === 'PAGARE' ? (
                /* ═══ PAGARÉ DOCUMENT ═══ */
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px', color: '#1a1a2e' }}>PAGARÉ</h2>
                    <p style={{ fontSize: '11px', color: '#666' }}>Título Valor — Ley N° 27287</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
                    <span><strong>Lugar:</strong> Lima, Perú</span>
                    <span><strong>Fecha:</strong> {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <div style={{ border: '2px solid #1a1a2e', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto</span>
                    <span style={{ fontSize: '22px', fontWeight: 700 }}>S/ {(solicitud.monto_solicitado + solicitud.monto_solicitado * (solicitud.tasa_interes / 100)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <p style={{ textAlign: 'justify', marginBottom: '16px' }}>
                    Debo(emos) y pagaré(mos) incondicionalmente a la orden de <strong>CLUBMONEY OPERACIONES S.A.C.</strong>,
                    la cantidad de <strong>S/ {(solicitud.monto_solicitado + solicitud.monto_solicitado * (solicitud.tasa_interes / 100)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> (Soles),
                    en un plazo de <strong>{solicitud.plazo_dias} días</strong> calendario, contados a partir de la fecha de desembolso.
                  </p>

                  <p style={{ textAlign: 'justify', marginBottom: '16px' }}>
                    La tasa de interés pactada es de <strong>{solicitud.tasa_interes}%</strong> sobre el capital de
                    <strong> S/ {solicitud.monto_solicitado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>.
                    El incumplimiento generará intereses moratorios según la tasa máxima permitida por el BCRP.
                  </p>

                  <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                      <div style={{ borderTop: '1px solid #333', paddingTop: '8px', fontSize: '11px' }}>
                        <strong>{solicitud.cliente?.nombre_completo ?? 'N/A'}</strong><br />
                        DNI: {solicitud.cliente?.dni ?? '—'}<br />
                        <em>Deudor(a)</em>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                      <div style={{ borderTop: '1px solid #333', paddingTop: '8px', fontSize: '11px' }}>
                        <strong>CLUBMONEY OPERACIONES</strong><br />
                        RUC: 20XXXXXXXXX<br />
                        <em>Acreedor</em>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ═══ CONTRATO DE PRÉSTAMO DOCUMENT ═══ */
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', color: '#1a1a2e' }}>CONTRATO DE PRÉSTAMO DE DINERO</h2>
                    <p style={{ fontSize: '11px', color: '#666' }}>Código Civil Art. 1648° — Mutuo Dinerario</p>
                  </div>

                  <p style={{ textAlign: 'justify', marginBottom: '16px' }}>
                    Conste por el presente documento, el contrato de préstamo de dinero que celebran de una parte:
                  </p>

                  <div style={{ background: '#f0f0f0', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                    <p style={{ marginBottom: '8px' }}><strong>EL MUTUANTE (Prestamista):</strong> CLUBMONEY OPERACIONES S.A.C., con domicilio legal en Lima, Perú.</p>
                    <p><strong>EL MUTUATARIO (Prestatario):</strong> {solicitud.cliente?.nombre_completo ?? 'N/A'}, identificado con DNI N° {solicitud.cliente?.dni ?? '—'}, con domicilio en {solicitud.cliente?.direccion ?? 'Lima, Perú'}.</p>
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>CLÁUSULA PRIMERA: DEL PRÉSTAMO</h4>
                  <p style={{ textAlign: 'justify', marginBottom: '16px' }}>
                    EL MUTUANTE entrega en calidad de préstamo a EL MUTUATARIO la suma de
                    <strong> S/ {solicitud.monto_solicitado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> (Soles),
                    mediante {solicitud.tipo_cronograma === 'FIJO' ? 'cuotas diarias fijas' : 'cronograma flexible'}, bajo las siguientes condiciones:
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
                    <tbody>
                      {[
                        ['Capital', `S/ ${solicitud.monto_solicitado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`],
                        ['Tasa de Interés', `${solicitud.tasa_interes}%`],
                        ['Interés', `S/ ${(solicitud.monto_solicitado * solicitud.tasa_interes / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`],
                        ['Total a Pagar', `S/ ${(solicitud.monto_solicitado + solicitud.monto_solicitado * solicitud.tasa_interes / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`],
                        ['Plazo', `${solicitud.plazo_dias} días calendario`],
                        ['Tipo de Cronograma', solicitud.tipo_cronograma ?? 'FIJO'],
                      ].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '6px 8px', color: '#555' }}>{k}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>CLÁUSULA SEGUNDA: DEL PLAZO Y PAGO</h4>
                  <p style={{ textAlign: 'justify', marginBottom: '16px' }}>
                    EL MUTUATARIO se obliga a devolver el monto total en un plazo de <strong>{solicitud.plazo_dias} días</strong>,
                    mediante pagos diarios en el domicilio del asesor asignado: <strong>{solicitud.asesor?.nombre_completo ?? 'N/A'}</strong>.
                  </p>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>CLÁUSULA TERCERA: DE LA MORA</h4>
                  <p style={{ textAlign: 'justify', marginBottom: '16px' }}>
                    El incumplimiento de cualquier cuota dará lugar al cobro de intereses moratorios conforme a la tasa máxima
                    permitida por el Banco Central de Reserva del Perú (BCRP).
                  </p>

                  <p style={{ fontSize: '11px', color: '#666', marginTop: '24px' }}>
                    Firmado en Lima, a los {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}.
                  </p>

                  <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                      <div style={{ borderTop: '1px solid #333', paddingTop: '8px', fontSize: '11px' }}>
                        <strong>{solicitud.cliente?.nombre_completo ?? 'N/A'}</strong><br />
                        DNI: {solicitud.cliente?.dni ?? '—'}<br />
                        <em>EL MUTUATARIO</em>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                      <div style={{ borderTop: '1px solid #333', paddingTop: '8px', fontSize: '11px' }}>
                        <strong>CLUBMONEY OPERACIONES</strong><br />
                        RUC: 20XXXXXXXXX<br />
                        <em>EL MUTUANTE</em>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ─── Loading skeleton ────────────────────────────────────── */
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

