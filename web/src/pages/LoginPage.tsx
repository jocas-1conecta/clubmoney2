import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
        setLoading(false)
        return
      }
      // Hard reload to establish a clean session without lock contention
      window.location.href = '/'
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-0)' }}
    >
      {/* Ambient glow — top right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 229, 160, 0.07) 0%, transparent 70%)',
        }}
      />
      {/* Ambient glow — bottom left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-15%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 141, 239, 0.05) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-[420px] animate-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1.25rem auto',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #00E5A0, #00B8D9)',
              color: '#060A13',
              boxShadow: '0 8px 32px rgba(0, 229, 160, 0.3)',
            }}
          >
            CM
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-3xl)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--color-text-1)',
              marginBottom: 'var(--sp-1)',
            }}
          >
            ClubMoney
          </h1>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)' }}>
            Panel de Operaciones
          </p>
        </div>

        {/* Card */}
        <div className="glass-card-login" style={{ padding: 'var(--sp-8)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-xl)',
              fontWeight: 600,
              color: 'var(--color-text-1)',
              marginBottom: 'var(--sp-1)',
            }}
          >
            Iniciar Sesión
          </h2>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-3)', marginBottom: 'var(--sp-6)' }}>
            Ingresa tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-3)',
                  marginBottom: 'var(--sp-2)',
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-3)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="input-field"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 'var(--sp-5)' }}>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-3)',
                  marginBottom: 'var(--sp-2)',
                }}
              >
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-3)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-base)',
                  marginBottom: 'var(--sp-4)',
                  backgroundColor: 'rgba(255, 92, 92, 0.08)',
                  border: '1px solid rgba(255, 92, 92, 0.15)',
                  color: 'var(--color-danger)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-danger)',
                    flexShrink: 0,
                  }}
                />
                {error}
              </div>
            )}

            {/* Button */}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--fs-sm)',
            color: 'var(--color-text-3)',
            marginTop: 'var(--sp-6)',
          }}
        >
          ClubMoney © {new Date().getFullYear()} — Microfinanzas con propósito
        </p>
      </div>
    </div>
  )
}
