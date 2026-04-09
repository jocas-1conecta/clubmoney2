import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'

/* ── Types ── */

export type TipoDato = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'JSON'

export interface ConfigItem {
  id: string
  clave: string
  valor: unknown
  tipo_dato: TipoDato
  descripcion: string | null
  zona_id: string | null
  actualizado_por: string | null
  created_at: string
  updated_at: string
}

export interface RolWithPermisos {
  id: string
  nombre: string
  descripcion: string | null
  estado: string
  permisos: PermisoItem[]
}

export interface PermisoItem {
  id: string
  codigo: string
  modulo: string
  descripcion: string | null
}

export interface ConfiguracionData {
  config: ConfigItem[]
  roles: RolWithPermisos[]
  allModules: string[]
  loading: boolean
  error: string | null
  saving: boolean
  updateConfigValue: (id: string, newValue: unknown) => Promise<boolean>
  refetch: () => void
}

/* ── Hook ── */

export function useConfiguracion(): ConfiguracionData {
  const [config, setConfig] = useState<ConfigItem[]>([])
  const [roles, setRoles] = useState<RolWithPermisos[]>([])
  const [allModules, setAllModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)

      try {
        const [configRes, rolesRes, permisosRes, rolPermisosRes] = await Promise.all([
          // All system config entries (global first, then zone-specific)
          supabase
            .from('configuracion_sistema')
            .select('*')
            .order('clave', { ascending: true }),

          // All roles
          supabase
            .from('roles')
            .select('*')
            .order('nombre', { ascending: true }),

          // All permissions
          supabase
            .from('permisos')
            .select('*')
            .eq('estado', 'ACTIVO')
            .order('modulo, codigo'),

          // Role-permission mappings
          supabase
            .from('rol_permisos')
            .select('rol_id, permiso_id'),
        ])

        if (cancelled) return

        // Handle errors
        if (configRes.error) throw new Error(`Config: ${configRes.error.message}`)
        if (rolesRes.error) throw new Error(`Roles: ${rolesRes.error.message}`)
        if (permisosRes.error) throw new Error(`Permisos: ${permisosRes.error.message}`)
        if (rolPermisosRes.error) throw new Error(`RolPermisos: ${rolPermisosRes.error.message}`)

        // Set config items
        setConfig((configRes.data ?? []) as ConfigItem[])

        // Build permission lookup
        const permisosMap = new Map<string, PermisoItem>()
        for (const p of (permisosRes.data ?? []) as PermisoItem[]) {
          permisosMap.set(p.id, p)
        }

        // Build role-permission index
        const rolPermisoIndex = new Map<string, Set<string>>()
        for (const rp of (rolPermisosRes.data ?? []) as { rol_id: string; permiso_id: string }[]) {
          if (!rolPermisoIndex.has(rp.rol_id)) {
            rolPermisoIndex.set(rp.rol_id, new Set())
          }
          rolPermisoIndex.get(rp.rol_id)!.add(rp.permiso_id)
        }

        // Assemble roles with their permissions
        const rolesWithPerms: RolWithPermisos[] = (
          (rolesRes.data ?? []) as { id: string; nombre: string; descripcion: string | null; estado: string }[]
        ).map((role) => {
          const permisoIds = rolPermisoIndex.get(role.id) ?? new Set()
          const permisos: PermisoItem[] = []
          for (const pid of permisoIds) {
            const p = permisosMap.get(pid)
            if (p) permisos.push(p)
          }
          permisos.sort((a, b) => `${a.modulo}.${a.codigo}`.localeCompare(`${b.modulo}.${b.codigo}`))
          return { ...role, permisos }
        })

        setRoles(rolesWithPerms)

        // Extract unique modules for categorization
        const modules = new Set<string>()
        for (const p of permisosMap.values()) {
          modules.add(p.modulo)
        }
        setAllModules(Array.from(modules).sort())

      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando configuración')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [trigger])

  /** Update a single config value. Returns true on success. */
  const updateConfigValue = useCallback(async (id: string, newValue: unknown): Promise<boolean> => {
    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('configuracion_sistema')
        .update({ valor: newValue, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      // Optimistic update in local state
      setConfig((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, valor: newValue, updated_at: new Date().toISOString() } : item
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando configuración')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { config, roles, allModules, loading, error, saving, updateConfigValue, refetch }
}
