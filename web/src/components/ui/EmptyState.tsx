import { type LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="cm-empty">
      <div className="cm-empty__icon">
        <Icon size={32} />
      </div>
      <h3 className="cm-empty__title">{title}</h3>
      {description && <p className="cm-empty__description">{description}</p>}
      {action && <div className="cm-empty__action">{action}</div>}
    </div>
  )
}
