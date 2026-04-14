import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Solicitud } from '@/types/solicitudes'

/* ─── Extended detail types ──────────────────────────────── */

export interface DocumentoSolicitud {
  id: string
  solicitud_id: string
  tipo_documento: string
  url_archivo: string
  estado_validacion: string
  notas: string | null
  created_at: string
}

export interface RevisionSupervisor {
  id: string
  solicitud_id: string
  supervisor_id: string
  dictamen: string
  monto_aprobado: number | null
  tasa_aprobada: number | null
  plazo_aprobado: number | null
  condiciones_especiales: string | null
  motivo: string | null
  created_at: string
  supervisor?: { nombre_completo: string }
}

export interface SeekerResultado {
  id: string
  solicitud_id: string
  cliente_id: string
  score: number | null
  resumen_deudas: Record<string, unknown> | null
  estado: string
  fecha_consulta: string
}

export interface SolicitudDetalle extends Solicitud {
  documentos?: DocumentoSolicitud[]
  revisiones?: RevisionSupervisor[]
  seeker?: SeekerResultado | null
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useSolicitudDetalle(solicitudId: string | undefined) {
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetalle = useCallback(async () => {
    if (!solicitudId) return
    setLoading(true)
    setError(null)

    try {
      // 1. Main solicitud with joins
      const { data: sol, error: solErr } = await supabase
        .from('solicitudes_prestamo')
        .select(`
          *,
          cliente:clientes(nombre_completo, dni, foto_url, telefono, direccion, calificacion_interna),
          asesor:perfiles!solicitudes_prestamo_asesor_id_fkey(nombre_completo)
        `)
        .eq('id', solicitudId)
        .single()

      if (solErr) throw solErr

      // 2. Documentos
      const { data: docs } = await supabase
        .from('documentos_solicitud')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('created_at', { ascending: true })

      // 2b. Resolve storage paths → signed URLs (valid 1h)
      const docsWithUrls = await Promise.all(
        (docs ?? []).map(async (doc) => {
          // If url_archivo is already a full URL (https://...), keep it
          if (doc.url_archivo.startsWith('http')) return doc
          // Otherwise, generate a signed URL from the relative storage path
          const { data: signedData } = await supabase.storage
            .from('documentos')
            .createSignedUrl(doc.url_archivo, 3600) // 1 hour
          return {
            ...doc,
            url_archivo: signedData?.signedUrl ?? doc.url_archivo,
          }
        })
      )

      // 3. Revisiones del supervisor
      const { data: revs } = await supabase
        .from('revisiones_supervisor')
        .select(`*, supervisor:perfiles!revisiones_supervisor_supervisor_id_fkey(nombre_completo)`)
        .eq('solicitud_id', solicitudId)
        .order('created_at', { ascending: false })

      // 4. Seeker resultado
      const { data: seekerData } = await supabase
        .from('seeker_resultados')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('fecha_consulta', { ascending: false })
        .limit(1)
        .maybeSingle()

      setSolicitud({
        ...sol,
        documentos: docsWithUrls,
        revisiones: revs ?? [],
        seeker: seekerData ?? null,
      } as SolicitudDetalle)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar solicitud'
      setError(msg)
      console.error('[useSolicitudDetalle]', msg)
    } finally {
      setLoading(false)
    }
  }, [solicitudId])

  useEffect(() => {
    fetchDetalle()
  }, [fetchDetalle])

  /* ─── Actions ──────────────────────────────────────────── */

  /** Supervisor emite dictamen */
  async function emitirDictamen(data: {
    dictamen: 'APROBADA' | 'RECHAZADA' | 'OBSERVADA'
    motivo?: string
    monto_aprobado?: number
    tasa_aprobada?: number
    plazo_aprobado?: number
    condiciones_especiales?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !solicitudId) throw new Error('No autenticado')

    // Map UI values (feminine) → DB check constraint values (masculine)
    const dictamenDB: Record<string, string> = {
      APROBADA: 'APROBADO',
      RECHAZADA: 'RECHAZADO',
      OBSERVADA: 'OBSERVADO',
    }

    // 1. Insert revisión (uses masculine: APROBADO/RECHAZADO/OBSERVADO)
    const { error: revErr } = await supabase
      .from('revisiones_supervisor')
      .insert({
        solicitud_id: solicitudId,
        supervisor_id: user.id,
        dictamen: dictamenDB[data.dictamen] ?? data.dictamen,
        motivo: data.motivo || null,
        monto_aprobado: data.monto_aprobado || null,
        tasa_aprobada: data.tasa_aprobada || null,
        plazo_aprobado: data.plazo_aprobado || null,
        condiciones_especiales: data.condiciones_especiales || null,
      })

    if (revErr) throw revErr

    // 2. Update solicitud estado (uses feminine: APROBADA/RECHAZADA/OBSERVADA)
    const nuevoEstado =
      data.dictamen === 'APROBADA' ? 'EN_FORMALIZACION' :
      data.dictamen === 'RECHAZADA' ? 'RECHAZADA' :
      'OBSERVADA'

    const updatePayload: Record<string, unknown> = { estado: nuevoEstado }
    if (data.dictamen === 'RECHAZADA' && data.motivo) {
      updatePayload.motivo_rechazo = data.motivo
    }

    const { error: updErr } = await supabase
      .from('solicitudes_prestamo')
      .update(updatePayload)
      .eq('id', solicitudId)

    if (updErr) throw updErr

    // 3. If approved → auto-generate préstamo + contratos + cuotas + pagaré
    if (data.dictamen === 'APROBADA') {
      const { error: rpcErr } = await supabase
        .rpc('generar_formalizacion', { p_solicitud_id: solicitudId })

      if (rpcErr) {
        console.error('[emitirDictamen] generar_formalizacion failed:', rpcErr.message)
        // Don't throw — the dictamen was already saved, user can retry formalization
      }
    }

    await fetchDetalle()
  }

  /** Cambiar estado de evaluación */
  async function cambiarEstado(nuevoEstado: string) {
    if (!solicitudId) return
    const { error: err } = await supabase
      .from('solicitudes_prestamo')
      .update({ estado: nuevoEstado })
      .eq('id', solicitudId)

    if (err) throw err
    await fetchDetalle()
  }

  return {
    solicitud,
    loading,
    error,
    refetch: fetchDetalle,
    emitirDictamen,
    cambiarEstado,
  }
}
