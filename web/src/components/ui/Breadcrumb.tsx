import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="cm-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="cm-breadcrumb__item">
            {item.href && !isLast ? (
              <Link to={item.href} className="cm-breadcrumb__link">
                {item.label}
              </Link>
            ) : (
              <span className={`cm-breadcrumb__text ${isLast ? 'cm-breadcrumb__text--current' : ''}`}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={13} className="cm-breadcrumb__sep" />}
          </span>
        )
      })}
    </nav>
  )
}
