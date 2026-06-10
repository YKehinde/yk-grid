import { ColumnDef, GroupHeaderRow } from '../types'
import styles from './GroupRow.module.css'

interface Props<T> {
  row: GroupHeaderRow
  columns: ColumnDef<T>[]
  visibleColumnIds: Set<string>
  onToggle: () => void
}

function formatValue(value: GroupHeaderRow['value']): string {
  if (value === null) return '(empty)'
  if (value instanceof Date) return value.toLocaleDateString()
  return String(value)
}

function formatAggregate(value: number | null, type: string): string | null {
  if (value === null) return null
  if (type === 'avg') return value.toFixed(2)
  if (type === 'count') return String(value)
  return value.toLocaleString()
}

export function GroupRow<T>({ row, columns, visibleColumnIds, onToggle }: Props<T>) {
  const visible = columns.filter((c) => visibleColumnIds.has(c.id))
  const labelCol = columns.find((c) => c.id === row.columnId)

  return (
    <tr className={styles.groupRow} aria-level={row.depth + 1}>
      {visible.map((col, i) => {
        if (i === 0) {
          return (
            <td
              key={col.id}
              className={styles.labelCell}
              style={{ paddingLeft: `${row.depth * 1.5 + 0.5}rem` }}
              colSpan={1}
            >
              <button
                className={styles.toggleBtn}
                onClick={onToggle}
                aria-expanded={row.isExpanded}
                aria-label={`${row.isExpanded ? 'Collapse' : 'Expand'} group ${formatValue(row.value)}`}
                type="button"
              >
                {row.isExpanded ? '▼' : '▶'}
              </button>
              <span className={styles.colHeader}>
                {labelCol?.header ?? row.columnId}:
              </span>
              <span className={styles.groupValue}>{formatValue(row.value)}</span>
              <span className={styles.childCount}>({row.childCount})</span>
            </td>
          )
        }

        const aggVal = row.aggregates[col.id]
        const aggType = col.aggregation
        return (
          <td key={col.id} className={styles.aggregateCell}>
            {aggType && aggVal !== undefined
              ? formatAggregate(aggVal, aggType)
              : null}
          </td>
        )
      })}
    </tr>
  )
}
