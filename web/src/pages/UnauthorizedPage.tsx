import { useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-surface-0)' }}
    >
      <div className="text-center animate-in max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'rgba(255, 92, 92, 0.1)',
            border: '1px solid rgba(255, 92, 92, 0.15)',
          }}
        >
          <ShieldOff size={28} style={{ color: 'var(--color-danger)' }} />
        </div>
        <h1
          className="text-xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-1)' }}
        >
          Acceso Denegado
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-3)' }}>
          No tienes permisos suficientes para acceder a esta sección.
          Contacta al administrador si crees que esto es un error.
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200"
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-1)',
            border: '1px solid var(--color-border-1)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-2)'
            e.currentTarget.style.background = 'var(--color-surface-3)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-1)'
            e.currentTarget.style.background = 'var(--color-surface-2)'
          }}
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </button>
      </div>
    </div>
  )
}
