interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={`cm-avatar cm-avatar--${size} ${className}`}
      />
    )
  }

  return (
    <div className={`cm-avatar cm-avatar--${size} cm-avatar--initials ${className}`}>
      {initials}
    </div>
  )
}
