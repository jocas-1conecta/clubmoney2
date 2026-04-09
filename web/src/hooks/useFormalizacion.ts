import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'

/* ─── Types ──────────────────────────────────────────────── */

export interface Contrato {
  id: string
  prestamo_id: string
  tipo_contrato: string
  url_archivo_generado: string | null
  url_archivo: string | null
  firmado: boolean
  fecha_firma: string | null
  validado_por_tesoreria: boolean
  notas: string | null
  estado: string
  created_at: string
}

export interface Desembolso {
  id: string
  prestamo_id: string
  tesorero_id: string
  monto: number
  medio_desembolso: string
  banco_destino: string | null
  cuenta_destino: string | null
  numero_operacion: string | null
  url_comprobante: string | null
  fecha_desembolso: string
  estado: string
  created_at: string
  tesorero?: { nombre_completo: string }
}

export interface RecepcionPagare {
  id: string
  contrato_id: string
  prestamo_id: string
  asesor_id: string
  recibido_por: string | null
  fecha_entrega: string | null
  fecha_recepcion: string | null
  recibido: boolean
  notas: string | null
  estado: string
  created_at: string
  asesor?: { nombre_completo: string }
  receptor?: { nombre_completo: string }
}

export interface FormalizacionData {
  contratos: Contrato[]
  desembolsos: Desembolso[]
  pagares: RecepcionPagare[]
  prestamoId: string | null
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useFormalizacion(solicitudId: string | undefined) {
  const [data, setData] = useState<FormalizacionData>({
    contratos: [],
    desembolsos: [],
    pagares: [],
    prestamoId: null,
  })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!solicitudId) return
    setLoading(true)

    try {
      // First find the prestamo linked to this solicitud
      const { data: prestamo } = await supabase
        .from('prestamos')
        .select('id')
        .eq('solicitud_id', solicitudId)
        .maybeSingle()

      if (!prestamo) {
        setData({ contratos: [], desembolsos: [], pagares: [], prestamoId: null })
        setLoading(false)
        return
      }

      const pid = prestamo.id

      const [contratosRes, desembolsosRes, pagaresRes] = await Promise.all([
        supabase
          .from('contratos')
          .select('*')
          .eq('prestamo_id', pid)
          .order('created_at', { ascending: false }),
        supabase
          .from('desembolsos')
          .select('*, tesorero:perfiles!desembolsos_tesorero_id_fkey(nombre_completo)')
          .eq('prestamo_id', pid)
          .order('created_at', { ascending: false }),
        supabase
          .from('recepcion_pagares')
          .select('*, asesor:perfiles!recepcion_pagares_asesor_id_fkey(nombre_completo)')
          .eq('prestamo_id', pid)
          .order('created_at', { ascending: false }),
      ])

      setData({
        contratos: (contratosRes.data ?? []) as Contrato[],
        desembolsos: (desembolsosRes.data ?? []) as Desembolso[],
        pagares: (pagaresRes.data ?? []) as RecepcionPagare[],
        prestamoId: pid,
      })
    } catch (err) {
      console.error('[useFormalizacion]', err)
    } finally {
      setLoading(false)
    }
  }, [solicitudId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ─── Actions ────────────────────────────────────── */

  /** Create contrato record */
  async function crearContrato(prestamoId: string, tipoContrato: string, urlArchivo?: string) {
    const { error } = await supabase
      .from('contratos')
      .insert({
        prestamo_id: prestamoId,
        tipo_contrato: tipoContrato,
        url_archivo: urlArchivo ?? null,
        firmado: false,
        validado_por_tesoreria: false,
        estado: 'GENERADO',
      })
    if (error) throw error
    await fetchData()
  }

  /** Mark contrato as firmado */
  async function firmarContrato(contratoId: string) {
    const { error } = await supabase
      .from('contratos')
      .update({ firmado: true, fecha_firma: new Date().toISOString(), estado: 'FIRMADO' })
      .eq('id', contratoId)
    if (error) throw error
    await fetchData()
  }

  /** Tesorería validates contrato */
  async function validarContrato(contratoId: string) {
    const { error } = await supabase
      .from('contratos')
      .update({ validado_por_tesoreria: true, estado: 'VALIDADO' })
      .eq('id', contratoId)
    if (error) throw error
    await fetchData()
  }

  /** Register desembolso */
  async function registrarDesembolso(input: {
    prestamoId: string
    monto: number
    medio: string
    banco?: string
    cuenta?: string
    numeroOperacion?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('desembolsos')
      .insert({
        prestamo_id: input.prestamoId,
        tesorero_id: user.id,
        monto: input.monto,
        medio_desembolso: input.medio,
        banco_destino: input.banco ?? null,
        cuenta_destino: input.cuenta ?? null,
        numero_operacion: input.numeroOperacion ?? null,
        fecha_desembolso: new Date().toISOString(),
        estado: 'COMPLETADO',
      })
    if (error) throw error

    // Update solicitud to PENDIENTE_DESEMBOLSO -> next logical state
    await supabase
      .from('solicitudes_prestamo')
      .update({ estado: 'DESEMBOLSADA' })
      .eq('id', solicitudId)

    await fetchData()
  }

  /** Mark pagaré as received */
  async function recibirPagare(pagareId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('recepcion_pagares')
      .update({
        recibido: true,
        recibido_por: user.id,
        fecha_recepcion: new Date().toISOString(),
        estado: 'RECIBIDO',
      })
      .eq('id', pagareId)
    if (error) throw error
    await fetchData()
  }

  return {
    ...data,
    loading,
    refetch: fetchData,
    crearContrato,
    firmarContrato,
    validarContrato,
    registrarDesembolso,
    recibirPagare,
  }
}
