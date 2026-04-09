import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import {
  Upload,
  FileImage,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/utils/supabase/client'

/* ─── Types ────────────────────────────────────────────────── */

export type TipoDocumento =
  | 'DNI_FRONTAL'
  | 'DNI_REVERSO'
  | 'RECIBO_LUZ'
  | 'CONTRATO_ALQUILER'
  | 'SELFIE'
  | 'PRUEBA_VIDA'

interface DocSlot {
  tipo: TipoDocumento
  label: string
  required: boolean
}

export interface UploadedDoc {
  tipo: TipoDocumento
  url: string
  fileName: string
}

interface DocumentUploaderProps {
  solicitudId: string
  onUploadsChange?: (docs: UploadedDoc[]) => void
}

/* ─── Slots definition ─────────────────────────────────────── */

const DOC_SLOTS: DocSlot[] = [
  { tipo: 'DNI_FRONTAL', label: 'DNI — Frontal', required: true },
  { tipo: 'DNI_REVERSO', label: 'DNI — Reverso', required: true },
  { tipo: 'RECIBO_LUZ', label: 'Recibo de Luz / Servicios', required: false },
  { tipo: 'SELFIE', label: 'Selfie del Cliente', required: true },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ─── Helpers ──────────────────────────────────────────────── */

type SlotStatus = 'empty' | 'uploading' | 'uploaded' | 'error'

interface SlotState {
  status: SlotStatus
  preview?: string
  fileName?: string
  url?: string
  error?: string
  progress?: number
}

/* ─── Component ────────────────────────────────────────────── */

export default function DocumentUploader({ solicitudId, onUploadsChange }: DocumentUploaderProps) {
  const [slots, setSlots] = useState<Record<TipoDocumento, SlotState>>(
    Object.fromEntries(DOC_SLOTS.map((s) => [s.tipo, { status: 'empty' as SlotStatus }])) as Record<TipoDocumento, SlotState>
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeSlot, setActiveSlot] = useState<TipoDocumento | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<TipoDocumento | null>(null)

  const updateSlot = useCallback((tipo: TipoDocumento, update: Partial<SlotState>) => {
    setSlots((prev) => ({ ...prev, [tipo]: { ...prev[tipo], ...update } }))
  }, [])

  const emitChange = useCallback((updatedSlots: Record<TipoDocumento, SlotState>) => {
    const docs: UploadedDoc[] = Object.entries(updatedSlots)
      .filter(([, s]) => s.status === 'uploaded' && s.url)
      .map(([tipo, s]) => ({
        tipo: tipo as TipoDocumento,
        url: s.url!,
        fileName: s.fileName!,
      }))
    onUploadsChange?.(docs)
  }, [onUploadsChange])

  async function handleFile(file: File, tipo: TipoDocumento) {
    // Validate
    if (!ACCEPTED_TYPES.includes(file.type)) {
      updateSlot(tipo, { status: 'error', error: 'Solo imágenes JPG, PNG o WebP' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      updateSlot(tipo, { status: 'error', error: 'El archivo excede 5MB' })
      return
    }

    // Preview
    const preview = URL.createObjectURL(file)
    updateSlot(tipo, { status: 'uploading', preview, progress: 0 })

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${solicitudId}/${tipo}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL (still requires auth since bucket is private)
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(path)

      const url = urlData.publicUrl

      // Insert record in documentos_solicitud
      const { error: dbError } = await supabase
        .from('documentos_solicitud')
        .insert({
          solicitud_id: solicitudId,
          tipo_documento: tipo,
          url_archivo: path, // store relative path
          estado_validacion: 'RECIBIDO',
        })

      if (dbError) throw dbError

      updateSlot(tipo, { status: 'uploaded', url, fileName: file.name, progress: 100 })

      // Emit updated list
      setSlots((prev) => {
        const updated = { ...prev, [tipo]: { ...prev[tipo], status: 'uploaded' as SlotStatus, url, fileName: file.name } }
        emitChange(updated)
        return updated
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir archivo'
      updateSlot(tipo, { status: 'error', error: msg, preview })
    }
  }

  function handleDrop(e: DragEvent, tipo: TipoDocumento) {
    e.preventDefault()
    setDragOverSlot(null)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file, tipo)
  }

  function handleDragOver(e: DragEvent, tipo: TipoDocumento) {
    e.preventDefault()
    setDragOverSlot(tipo)
  }

  function handleDragLeave() {
    setDragOverSlot(null)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && activeSlot) handleFile(file, activeSlot)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openFilePicker(tipo: TipoDocumento) {
    setActiveSlot(tipo)
    fileInputRef.current?.click()
  }

  function removeDoc(tipo: TipoDocumento) {
    updateSlot(tipo, { status: 'empty', preview: undefined, url: undefined, fileName: undefined, error: undefined })
    setSlots((prev) => {
      const updated = { ...prev, [tipo]: { status: 'empty' as SlotStatus } }
      emitChange(updated)
      return updated
    })
  }

  const uploadedCount = Object.values(slots).filter((s) => s.status === 'uploaded').length
  const requiredCount = DOC_SLOTS.filter((s) => s.required).length
  const requiredUploaded = DOC_SLOTS.filter((s) => s.required && slots[s.tipo].status === 'uploaded').length

  return (
    <div className="cm-doc-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Progress indicator */}
      <div className="cm-doc-uploader__progress">
        <div className="cm-doc-uploader__progress-text">
          <span style={{ fontWeight: 600, color: 'var(--color-text-1)' }}>
            {uploadedCount}/{DOC_SLOTS.length} documentos
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: requiredUploaded === requiredCount ? 'var(--color-success)' : 'var(--color-text-3)' }}>
            {requiredUploaded === requiredCount ? '✓ Obligatorios completos' : `${requiredUploaded}/${requiredCount} obligatorios`}
          </span>
        </div>
        <div className="cm-doc-uploader__progress-bar">
          <div
            className="cm-doc-uploader__progress-fill"
            style={{ width: `${(uploadedCount / DOC_SLOTS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Slots grid */}
      <div className="cm-doc-uploader__grid">
        {DOC_SLOTS.map((slot) => {
          const state = slots[slot.tipo]
          const isDragOver = dragOverSlot === slot.tipo

          return (
            <div
              key={slot.tipo}
              className={`cm-doc-slot cm-doc-slot--${state.status} ${isDragOver ? 'cm-doc-slot--dragover' : ''}`}
              onDrop={(e) => handleDrop(e, slot.tipo)}
              onDragOver={(e) => handleDragOver(e, slot.tipo)}
              onDragLeave={handleDragLeave}
              onClick={() => state.status !== 'uploading' && openFilePicker(slot.tipo)}
            >
              {/* Preview / Icon */}
              <div className="cm-doc-slot__visual">
                {state.preview || state.status === 'uploaded' ? (
                  <img
                    src={state.preview}
                    alt={slot.label}
                    className="cm-doc-slot__preview"
                  />
                ) : state.status === 'uploading' ? (
                  <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                ) : state.status === 'error' ? (
                  <AlertTriangle size={28} style={{ color: 'var(--color-warning)' }} />
                ) : (
                  <FileImage size={28} style={{ color: 'var(--color-text-3)' }} />
                )}
              </div>

              {/* Label */}
              <div className="cm-doc-slot__info">
                <span className="cm-doc-slot__label">
                  {slot.label}
                  {slot.required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
                </span>
                <span className="cm-doc-slot__status">
                  {state.status === 'empty' && 'Arrastra o haz clic'}
                  {state.status === 'uploading' && 'Subiendo...'}
                  {state.status === 'uploaded' && (
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Subido
                    </span>
                  )}
                  {state.status === 'error' && (
                    <span style={{ color: 'var(--color-danger)' }}>{state.error}</span>
                  )}
                </span>
              </div>

              {/* Actions */}
              {(state.status === 'uploaded' || state.status === 'error') && (
                <button
                  className="cm-doc-slot__remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeDoc(slot.tipo)
                  }}
                  title="Eliminar"
                >
                  {state.status === 'uploaded' ? <Trash2 size={14} /> : <XCircle size={14} />}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Upload all hint */}
      <div className="cm-doc-uploader__hint">
        <Upload size={14} style={{ opacity: 0.5 }} />
        <span>Formatos: JPG, PNG, WebP · Máx. 5MB por archivo</span>
      </div>
    </div>
  )
}
