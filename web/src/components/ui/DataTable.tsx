import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { TableSkeleton } from './Skeleton'
import EmptyState from './EmptyState'

// ─── Types ───────────────────────────────────────────────────────
export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  /** Set keyField to extract unique key from each row */
  keyField?: keyof T
  /** Click on a row */
  onRowClick?: (row: T) => void
  /** Pagination */
  page?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  /** Sorting */
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  /** Top-right slot (filters, search, etc.) */
  toolbar?: ReactNode
  /** Title */
  title?: string
  description?: string
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  emptyTitle = 'Sin registros',
  emptyDescription = 'No se encontraron datos para mostrar.',
  emptyAction,
  keyField = 'id' as keyof T,
  onRowClick,
  page = 1,
  pageSize = 15,
  totalCount,
  onPageChange,
  sortKey,
  sortDirection = 'asc',
  onSort,
  toolbar,
  title,
  description,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const activeSort = sortKey ? { key: sortKey, dir: sortDirection } : localSort
  const total = totalCount ?? data.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function handleSort(key: string) {
    const newDir: 'asc' | 'desc' =
      activeSort?.key === key && activeSort.dir === 'asc' ? 'desc' : 'asc'

    if (onSort) {
      onSort(key, newDir)
    } else {
      setLocalSort({ key, dir: newDir })
    }
  }

  // Client-side sort if no onSort provided
  let sortedData = data
  if (!onSort && localSort) {
    sortedData = [...data].sort((a, b) => {
      const rec = (v: T) => v as Record<string, unknown>
      const aVal = rec(a)[localSort.key]
      const bVal = rec(b)[localSort.key]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return localSort.dir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      const numA = Number(aVal)
      const numB = Number(bVal)
      return localSort.dir === 'asc' ? numA - numB : numB - numA
    })
  }

  return (
    <div className="cm-datatable">
      {/* Header area */}
      {(title || toolbar) && (
        <div className="cm-datatable__header">
          <div>
            {title && <h2 className="cm-datatable__title">{title}</h2>}
            {description && <p className="cm-datatable__description">{description}</p>}
          </div>
          {toolbar && <div className="cm-datatable__toolbar">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="cm-datatable__scroll">
        {loading ? (
          <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} cols={columns.length} />
        ) : sortedData.length === 0 ? (
          <div style={{ padding: '3rem 1rem' }}>
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          </div>
        ) : (
          <table className="cm-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      textAlign: col.align ?? 'left',
                    }}
                    className={col.sortable ? 'cm-table__th--sortable' : ''}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="cm-table__th-content">
                      {col.header}
                      {col.sortable && (
                        <span className="cm-table__sort-icon">
                          {activeSort?.key === col.key ? (
                            activeSort.dir === 'asc' ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )
                          ) : (
                            <ChevronsUpDown size={13} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr
                  key={String(row[keyField])}
                  className={onRowClick ? 'cm-table__row--clickable' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align ?? 'left' }}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {onPageChange && total > pageSize && (
        <div className="cm-datatable__pagination">
          <span className="cm-datatable__page-info">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </span>
          <div className="cm-datatable__page-actions">
            <button
              className="cm-datatable__page-btn"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  className={`cm-datatable__page-num ${page === pageNum ? 'cm-datatable__page-num--active' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              className="cm-datatable__page-btn"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
