import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useConfiguracion, type ConfigItem, type TipoDato } from '@/hooks/useConfiguracion'
import { Skeleton, Tabs } from '@/components/ui'
import {
  Settings,
  Shield,
  User,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

/* ── Helpers ── */

function formatTipoDato(tipo: TipoDato): string {
  const labels: Record<TipoDato, string> = {
    NUMBER: 'Numérico',
    STRING: 'Texto',
    BOOLEAN: 'Sí / No',
    JSON: 'JSON',
  }
  return labels[tipo] ?? tipo
}

function displayValue(item: ConfigItem): string {
  const val = item.valor
  if (val === null || val === undefined) return '—'
  if (item.tipo_dato === 'BOOLEAN') return val ? 'Sí' : 'No'
  if (item.tipo_dato === 'JSON') return JSON.stringify(val, null, 2)
  return String(val)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ROLE_LABELS: Record<string, string> = {
  ASESOR_COMERCIAL: 'Asesor Comercial',
  COBRADOR_VERIFICADOR: 'Cobrador / Verificador',
  SUPERVISOR: 'Supervisor',
  TESORERIA: 'Tesorería',
  ASESOR_ADMINISTRATIVO: 'Asesor Administrativo',
  GERENCIA: 'Gerencia',
}

/* ── Inline Config Editor ── */

function ConfigValueEditor({
  item,
  onSave,
  saving,
}: {
  item: ConfigItem
  onSave: (id: string, value: unknown) => Promise<boolean>
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [success, setSuccess] = useState(false)

  function startEdit() {
    const val = item.valor
    if (item.tipo_dato === 'JSON') {
      setDraft(JSON.stringify(val, null, 2))
    } else if (item.tipo_dato === 'BOOLEAN') {
      setDraft(val ? 'true' : 'false')
    } else {
      setDraft(String(val ?? ''))
    }
    setEditing(true)
    setSuccess(false)
  }

  async function handleSave() {
    let parsed: unknown = draft
    if (item.tipo_dato === 'NUMBER') parsed = Number(draft)
    else if (item.tipo_dato === 'BOOLEAN') parsed = draft === 'true'
    else if (item.tipo_dato === 'JSON') {
      try {
        parsed = JSON.parse(draft)
      } catch {
        return // Invalid JSON, don't save
      }
    }

    const ok = await onSave(item.id, parsed)
    if (ok) {
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--color-text-1)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid transparent',
            transition: 'border-color 0.2s',
          }}
          onClick={startEdit}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          title="Clic para editar"
        >
          {displayValue(item)}
        </span>
        {success && <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />}
      </div>
    )
  }

  // Edit mode
  if (item.tipo_dato === 'BOOLEAN') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--color-text-1)',
            padding: '4px 8px',
            fontSize: 'var(--fs-sm)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px',
            background: 'var(--color-accent)',
            color: 'var(--color-surface-1)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Save size={12} /> Guardar
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{
            padding: '4px 10px',
            background: 'none',
            border: '1px solid var(--color-border-2)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--color-text-3)',
            fontSize: 'var(--fs-xs)',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    )
  }

  // Text/Number/JSON editor
  const isMultiline = item.tipo_dato === 'JSON'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
      {isMultiline ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--color-text-1)',
            padding: '6px 8px',
            fontSize: 'var(--fs-xs)',
            fontFamily: 'var(--font-mono)',
            minWidth: '200px',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type={item.tipo_dato === 'NUMBER' ? 'number' : 'text'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--color-text-1)',
            padding: '4px 8px',
            fontSize: 'var(--fs-sm)',
            fontFamily: 'var(--font-mono)',
            width: '140px',
          }}
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px',
          background: 'var(--color-accent)',
          color: 'var(--color-surface-1)',
          border: 'none',
          borderRadius: 'var(--radius-xs)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        <Save size={12} /> Guardar
      </button>
      <button
        onClick={() => setEditing(false)}
        style={{
          padding: '4px 10px',
          background: 'none',
          border: '1px solid var(--color-border-2)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--color-text-3)',
          fontSize: 'var(--fs-xs)',
          cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
    </div>
  )
}

/* ── Page ── */

export default function ConfiguracionPage() {
  const { profile, roles: userRoles } = useAuth()
  const { config, roles, allModules, loading, error, saving, updateConfigValue, refetch } = useConfiguracion()

  const isGerencia = userRoles.includes('GERENCIA')

  const tabs = [
    { id: 'parametros', label: 'Parámetros', icon: <Settings size={16} />, badge: config.length || undefined },
    { id: 'roles', label: 'Roles y Permisos', icon: <Shield size={16} />, badge: roles.length || undefined },
    { id: 'sesion', label: 'Tu Sesión', icon: <User size={16} /> },
  ]

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-in" style={{ marginBottom: 'var(--sp-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-2xl)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--color-text-1)',
          }}>
            Configuración
          </h1>
          <p style={{ marginTop: '2px', fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>
            Parámetros del sistema, roles y permisos
          </p>
        </div>
        <button
          onClick={refetch}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-2)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text-2)' }}
        >
          <RefreshCw size={14} /> Refrescar
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          padding: 'var(--sp-3) var(--sp-4)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(255, 92, 92, 0.1)',
          border: '1px solid rgba(255, 92, 92, 0.3)',
          marginBottom: 'var(--sp-4)',
          fontSize: 'var(--fs-sm)',
          color: '#FF5C5C',
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="parametros">
        {(activeTab) => {
          if (activeTab === 'parametros') return <ParametrosTab config={config} loading={loading} isGerencia={isGerencia} saving={saving} onSave={updateConfigValue} />
          if (activeTab === 'roles') return <RolesTab roles={roles} allModules={allModules} loading={loading} />
          if (activeTab === 'sesion') return <SesionTab profile={profile} userRoles={userRoles} />
          return null
        }}
      </Tabs>
    </div>
  )
}

/* ── Tab: Parámetros ── */

function ParametrosTab({
  config,
  loading,
  isGerencia,
  saving,
  onSave,
}: {
  config: ConfigItem[]
  loading: boolean
  isGerencia: boolean
  saving: boolean
  onSave: (id: string, value: unknown) => Promise<boolean>
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', padding: 'var(--sp-4) 0' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
            <Skeleton width="180px" height="16px" />
            <Skeleton width="100px" height="16px" />
            <Skeleton width="220px" height="12px" />
          </div>
        ))}
      </div>
    )
  }

  if (config.length === 0) {
    return (
      <div style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <Settings size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto var(--sp-3)' }} />
        <p style={{ fontSize: 'var(--fs-md)', color: 'var(--color-text-3)', fontWeight: 500 }}>
          No hay parámetros configurados
        </p>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', marginTop: 'var(--sp-1)', opacity: 0.7 }}>
          Los parámetros del sistema se crean desde la base de datos
        </p>
      </div>
    )
  }

  // Group config by zona (global vs zona-specific)
  const globalConfig = config.filter((c) => !c.zona_id)
  const zonaConfig = config.filter((c) => c.zona_id)

  return (
    <div style={{ padding: 'var(--sp-4) 0' }}>
      {!isGerencia && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          padding: 'var(--sp-3) var(--sp-4)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(255, 181, 71, 0.1)',
          border: '1px solid rgba(255, 181, 71, 0.3)',
          marginBottom: 'var(--sp-4)',
          fontSize: 'var(--fs-sm)',
          color: '#FFB547',
        }}>
          <Shield size={14} /> Solo el rol Gerencia puede modificar parámetros del sistema
        </div>
      )}

      {/* Global config */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 'var(--sp-4)' }}>
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          borderBottom: '1px solid var(--color-border-1)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--color-text-1)' }}>
            Configuración Global
          </h3>
          <span style={{
            fontSize: 'var(--fs-xs)',
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-accent)',
            fontWeight: 600,
          }}>
            {globalConfig.length}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-1)' }}>
                {['Clave', 'Valor', 'Tipo', 'Descripción', 'Actualizado'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: 'var(--sp-3) var(--sp-4)',
                      textAlign: 'left',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--color-text-3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {globalConfig.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid var(--color-border-1)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {item.clave}
                  </td>
                  <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                    {isGerencia ? (
                      <ConfigValueEditor item={item} onSave={onSave} saving={saving} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-text-1)' }}>
                        {displayValue(item)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                    <span style={{
                      fontSize: 'var(--fs-xs)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(91, 141, 239, 0.1)',
                      color: '#5B8DEF',
                      fontWeight: 600,
                    }}>
                      {formatTipoDato(item.tipo_dato)}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', maxWidth: '280px' }}>
                    {item.descripcion ?? '—'}
                  </td>
                  <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>
                    {formatDate(item.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zona-specific config (if any) */}
      {zonaConfig.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            borderBottom: '1px solid var(--color-border-1)',
            display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--color-text-1)' }}>
              Configuración por Zona
            </h3>
            <span style={{
              fontSize: 'var(--fs-xs)',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 181, 71, 0.1)',
              color: '#FFB547',
              fontWeight: 600,
            }}>
              {zonaConfig.length}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-1)' }}>
                  {['Clave', 'Valor', 'Tipo', 'Zona', 'Actualizado'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 'var(--sp-3) var(--sp-4)',
                        textAlign: 'left',
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--color-text-3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zonaConfig.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--color-border-1)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-accent)', fontWeight: 500 }}>
                      {item.clave}
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      {isGerencia ? (
                        <ConfigValueEditor item={item} onSave={onSave} saving={saving} />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-text-1)' }}>
                          {displayValue(item)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                      <span style={{
                        fontSize: 'var(--fs-xs)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(91, 141, 239, 0.1)',
                        color: '#5B8DEF',
                        fontWeight: 600,
                      }}>
                        {formatTipoDato(item.tipo_dato)}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-sm)', color: 'var(--color-text-2)' }}>
                      {item.zona_id?.slice(0, 8) ?? '—'}
                    </td>
                    <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>
                      {formatDate(item.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tab: Roles y Permisos ── */

function RolesTab({
  roles,
  allModules: _allModules,
  loading,
}: {
  roles: import('@/hooks/useConfiguracion').RolWithPermisos[]
  allModules: string[]
  loading: boolean
}) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', padding: 'var(--sp-4) 0' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height="60px" rounded="md" />
        ))}
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <Shield size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto var(--sp-3)' }} />
        <p style={{ fontSize: 'var(--fs-md)', color: 'var(--color-text-3)', fontWeight: 500 }}>
          No hay roles configurados
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--sp-4) 0', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      {roles.map((role) => {
        const isExpanded = expandedRole === role.id
        // Group permissions by module
        const permsByModule = new Map<string, typeof role.permisos>()
        for (const p of role.permisos) {
          if (!permsByModule.has(p.modulo)) permsByModule.set(p.modulo, [])
          permsByModule.get(p.modulo)!.push(p)
        }

        return (
          <div key={role.id} className="glass-card" style={{ overflow: 'hidden' }}>
            <button
              onClick={() => setExpandedRole(isExpanded ? null : role.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--sp-4)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: role.estado === 'ACTIVO' ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255, 92, 92, 0.1)',
                }}>
                  <Shield size={18} style={{ color: role.estado === 'ACTIVO' ? '#00E5A0' : '#FF5C5C' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', fontWeight: 600, color: 'var(--color-text-1)' }}>
                    {ROLE_LABELS[role.nombre] ?? role.nombre}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-text-3)', marginTop: '2px' }}>
                    {role.descripcion ?? role.nombre} · {role.permisos.length} permisos
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <span style={{
                  fontSize: 'var(--fs-xs)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: role.estado === 'ACTIVO' ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255, 92, 92, 0.1)',
                  color: role.estado === 'ACTIVO' ? '#00E5A0' : '#FF5C5C',
                  fontWeight: 600,
                }}>
                  {role.estado}
                </span>
                <span style={{
                  color: 'var(--color-text-3)',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                  fontSize: '12px',
                }}>
                  ▼
                </span>
              </div>
            </button>

            {isExpanded && (
              <div style={{
                borderTop: '1px solid var(--color-border-1)',
                padding: 'var(--sp-4)',
              }}>
                {role.permisos.length === 0 ? (
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', fontStyle: 'italic' }}>
                    Este rol no tiene permisos asignados
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                    {Array.from(permsByModule.entries()).map(([modulo, perms]) => (
                      <div key={modulo}>
                        <h4 style={{
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--color-accent)',
                          marginBottom: 'var(--sp-2)',
                        }}>
                          {modulo}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                          {perms.map((p) => (
                            <span
                              key={p.id}
                              title={p.descripcion ?? p.codigo}
                              style={{
                                fontSize: 'var(--fs-xs)',
                                fontFamily: 'var(--font-mono)',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                backgroundColor: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border-1)',
                                color: 'var(--color-text-2)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.codigo}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Tab: Tu Sesión ── */

function SesionTab({
  profile,
  userRoles,
}: {
  profile: import('@/types/auth').UserProfile | null
  userRoles: string[]
}) {
  const fields = [
    { label: 'ID', value: profile?.id?.slice(0, 8) + '...' },
    { label: 'Nombre Completo', value: profile?.nombre_completo ?? '—' },
    { label: 'DNI', value: profile?.dni ?? '—' },
    { label: 'Email', value: profile?.email ?? '—' },
    { label: 'Teléfono', value: profile?.telefono ?? '—' },
    { label: 'Estado', value: profile?.estado ?? '—', isStatus: true },
    { label: 'Creado', value: profile?.created_at ? formatDate(profile.created_at) : '—' },
    { label: 'Última Modificación', value: profile?.updated_at ? formatDate(profile.updated_at) : '—' },
  ]

  return (
    <div style={{ padding: 'var(--sp-4) 0', display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-4)', maxWidth: '600px' }}>
      {/* Profile card */}
      <div className="glass-card" style={{ padding: 'var(--sp-4)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          color: 'var(--color-text-1)',
          marginBottom: 'var(--sp-4)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        }}>
          <User size={18} /> Información de Perfil
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {fields.map(({ label, value, isStatus }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)' }}>{label}</span>
              {isStatus ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
                  fontSize: 'var(--fs-sm)', fontWeight: 500,
                  color: value === 'ACTIVO' ? 'var(--color-success)' : '#FF5C5C',
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: value === 'ACTIVO' ? 'var(--color-success)' : '#FF5C5C',
                    boxShadow: value === 'ACTIVO' ? '0 0 8px rgba(0, 229, 160, 0.5)' : 'none',
                  }} />
                  {value}
                </span>
              ) : (
                <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--color-text-1)', fontFamily: label === 'ID' ? 'var(--font-mono)' : 'inherit' }}>
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="glass-card" style={{ padding: 'var(--sp-4)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          color: 'var(--color-text-1)',
          marginBottom: 'var(--sp-3)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        }}>
          <Shield size={18} /> Roles Asignados
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          {userRoles.length === 0 ? (
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-text-3)', fontStyle: 'italic' }}>
              Sin roles asignados
            </span>
          ) : (
            userRoles.map((role) => (
              <span
                key={role}
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  padding: '4px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                {ROLE_LABELS[role] ?? role}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
