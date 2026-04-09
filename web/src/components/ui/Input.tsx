import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`cm-input-group ${error ? 'cm-input-group--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="cm-input-label">
            {label}
          </label>
        )}
        <div className="cm-input-wrapper">
          {icon && <span className="cm-input-icon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`cm-input ${icon ? 'cm-input--with-icon' : ''}`}
            {...props}
          />
        </div>
        {error && <p className="cm-input-error">{error}</p>}
        {hint && !error && <p className="cm-input-hint">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
