import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export default function SearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(externalValue ?? '')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (externalValue !== undefined) {
      setLocalValue(externalValue)
    }
  }, [externalValue])

  function handleChange(val: string) {
    setLocalValue(val)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onChange(val), debounceMs)
  }

  function handleClear() {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={`cm-search ${className}`}>
      <Search size={15} className="cm-search__icon" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="cm-search__input"
      />
      {localValue && (
        <button onClick={handleClear} className="cm-search__clear" aria-label="Limpiar búsqueda">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
