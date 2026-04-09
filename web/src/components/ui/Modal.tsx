import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
  /** When false, clicking the backdrop or pressing Escape will NOT close the modal. Default: true */
  closeOnBackdrop?: boolean
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnBackdrop) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="cm-modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current && closeOnBackdrop) onClose()
      }}
    >
      <div className={`cm-modal cm-modal--${size}`} role="dialog" aria-modal="true">
        {/* Header */}
        {(title || description) && (
          <div className="cm-modal__header">
            <div>
              {title && <h2 className="cm-modal__title">{title}</h2>}
              {description && <p className="cm-modal__description">{description}</p>}
            </div>
            {closeOnBackdrop && (
              <button
                onClick={onClose}
                className="cm-modal__close"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="cm-modal__body">{children}</div>

        {/* Footer */}
        {footer && <div className="cm-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
