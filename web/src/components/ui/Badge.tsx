type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

export default function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span className={`cm-badge cm-badge--${variant} ${className}`}>
      {dot && <span className="cm-badge__dot" />}
      {children}
    </span>
  )
}

/** Map common status strings to badge variants */
export function statusVariant(
  status: string
): BadgeVariant {
  const s = status.toUpperCase()
  if (['ACTIVO', 'ACTIVA', 'APROBADO', 'APROBADA', 'CONCILIADO', 'PAGADA', 'COMPLETADA', 'RECUPERADO', 'VALIDADO', 'RECIBIDO', 'EXCELENTE', 'BUENO'].includes(s))
    return 'success'
  if (['PENDIENTE', 'EN_EVALUACION', 'PENDIENTE_DESEMBOLSO', 'EN_PROCESO', 'PARCIAL', 'REGULAR', 'CALCULADA', 'PLANIFICADA', 'INGRESADA', 'EN_CURSO', 'PROGRAMADA'].includes(s))
    return 'warning'
  if (['INACTIVO', 'INACTIVA', 'RECHAZADO', 'RECHAZADA', 'ANULADO', 'VENCIDA', 'MORA', 'EN_MORA', 'SUSPENDIDO', 'BLOQUEADO', 'MALO', 'CASTIGO', 'SOSPECHOSO', 'FALLIDA', 'EXTRAVIADO'].includes(s))
    return 'danger'
  if (['EN_FORMALIZACION', 'VERIFICACION_CAMPO', 'EN_GESTION', 'EN_REVISION', 'OBSERVADA', 'CIERRE_CON_CUSTODIA'].includes(s))
    return 'info'
  return 'neutral'
}
