import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = '', ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`cm-input-group ${error ? 'cm-input-group--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="cm-input-label">
            {label}
          </label>
        )}
        <div className="cm-select-wrapper">
          <select ref={ref} id={selectId} className="cm-select" {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="cm-select-chevron" />
        </div>
        {error && <p className="cm-input-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
