import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  Route,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/solicitudes', icon: FileText, label: 'Solicitudes' },
  { to: '/prestamos', icon: Wallet, label: 'Préstamos' },
  { to: '/cobranza', icon: Route, label: 'Cobranza' },
  { to: '/morosidad', icon: AlertTriangle, label: 'Morosidad' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

export default function DashboardLayout() {
  const { profile, roles, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const roleLabel = roles[0]?.replace(/_/g, ' ') ?? 'Sin rol'
  const initials = profile?.nombre_completo
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('') ?? '?'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-0)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(6, 10, 19, 0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
         className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          lg:static lg:translate-x-0
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-w)',
          background: 'linear-gradient(180deg, var(--color-surface-1) 0%, var(--color-surface-0) 100%)',
          borderRight: '1px solid var(--color-border-1)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ height: 'var(--header-h)', padding: '12px 16px 0 16px' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #00E5A0, #00B8D9)',
                color: '#060A13',
              }}
            >
              CM
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block" style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                ClubMoney
              </span>
              <span className="text-[9px] uppercase tracking-[0.12em] block" style={{ color: 'var(--color-text-3)' }}>
                Operaciones
              </span>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-md cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            style={{ color: 'var(--color-text-3)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 16px 8px 16px' }}>
          <div style={{ marginBottom: '6px', paddingLeft: '12px' }}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-3)' }}>
              Menú Principal
            </span>
          </div>
          <ul className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div style={{ padding: '8px 16px 32px 16px', borderTop: '1px solid var(--color-border-1)' }} className="shrink-0">
          <div className="flex items-center gap-2 p-2 rounded-lg mb-1.5" style={{ background: 'rgba(139, 157, 195, 0.04)' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 229, 160, 0.2), rgba(91, 141, 239, 0.2))',
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-display)',
                border: '1px solid rgba(0, 229, 160, 0.15)',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-1)' }}>
                {profile?.nombre_completo ?? 'Cargando...'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-3)' }}>
                {roleLabel}
              </p>
            </div>
          </div>
          <button onClick={handleSignOut} className="signout-btn">
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between shrink-0"
          style={{
            height: 'var(--header-h)',
            padding: '0 24px',
            background: 'rgba(12, 17, 33, 0.6)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--color-border-1)',
          }}
        >
          <button
            className="lg:hidden p-2 rounded-lg cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            style={{ color: 'var(--color-text-2)', background: 'var(--color-surface-2)' }}
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="header-icon-btn" aria-label="Notificaciones">
              <Bell size={18} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: 'var(--color-accent)', boxShadow: '0 0 6px rgba(0, 229, 160, 0.5)' }}
              />
            </button>

            {/* Role badge */}
            <span
              className="text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider"
              style={{
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                border: '1px solid rgba(0, 229, 160, 0.12)',
              }}
            >
              {roleLabel}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 24px 32px 24px', background: 'var(--color-surface-0)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
