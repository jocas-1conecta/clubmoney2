interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  style?: React.CSSProperties
}

export default function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  style,
}: SkeletonProps) {
  return (
    <div
      className={`cm-skeleton cm-skeleton--${rounded} ${className}`}
      style={{ width, height, ...style }}
    />
  )
}

/** Table loading skeleton */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '1rem',
          padding: '0.875rem 1.25rem',
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} height="14px" width="60%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '1rem',
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--color-border-1)',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`r${r}-c${c}`} height="16px" width={c === 0 ? '80%' : '50%'} />
          ))}
        </div>
      ))}
    </div>
  )
}
