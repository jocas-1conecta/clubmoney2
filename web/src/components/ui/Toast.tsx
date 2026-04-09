import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  exiting?: boolean
}

// ─── Global store (no external deps) ─────────────────────────────
let listeners: (() => void)[] = []
let toasts: Toast[] = []

function emit() {
  listeners.forEach((l) => l())
}

function removeToast(id: string) {
  // Mark as exiting first to play animation
  toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t))
  emit()
  // Actually remove after animation (matches --dur-base: 200ms)
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 200)
}

export function toast(
  type: ToastType,
  title: string,
  description?: string,
  duration = 4000
) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, type, title, description, duration }]
  emit()

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
}

/** Convenience shortcuts */
toast.success = (title: string, description?: string) =>
  toast('success', title, description)
toast.error = (title: string, description?: string) =>
  toast('error', title, description)
toast.warning = (title: string, description?: string) =>
  toast('warning', title, description)
toast.info = (title: string, description?: string) =>
  toast('info', title, description)

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

/** Place once in your app (e.g. in App.tsx) */
export function ToastContainer() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const dismiss = useCallback((id: string) => removeToast(id), [])

  return (
    <div className="cm-toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`cm-toast cm-toast--${t.type}${t.exiting ? ' cm-toast--exiting' : ''}`}
        >
          <span className="cm-toast__icon">{icons[t.type]}</span>
          <div className="cm-toast__content">
            <p className="cm-toast__title">{t.title}</p>
            {t.description && (
              <p className="cm-toast__description">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="cm-toast__close"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
