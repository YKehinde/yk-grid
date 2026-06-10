import { useState, useEffect, useRef } from 'react'
import { ColumnDef, FilterEntry } from '../types'
import styles from './FilterControl.module.css'

interface Props<T> {
  column: ColumnDef<T>
  // Current filter value from grid state (may be set by AI or externally).
  value: FilterEntry['value'] | null
  onChange: (value: FilterEntry['value'] | null, operator: FilterEntry['operator']) => void
}

// Default operator per filter type — the UI exposes one operator each.
// All operators are available to the AI and via GridRef.setState.
const DEFAULT_OPERATOR: Record<NonNullable<ColumnDef<unknown>['filterType']>, FilterEntry['operator']> = {
  text: 'contains',
  number: 'eq',
  select: 'eq',
  date: 'eq',
}

const DEBOUNCE_MS = 300

export function FilterControl<T>({ column, value, onChange }: Props<T>) {
  const filterable = column.filterable !== false
  if (!filterable) return <td className={styles.cell} />

  const filterType = column.filterType ?? 'text'
  const operator = DEFAULT_OPERATOR[filterType]

  // Local state for responsive input; debounce dispatches upstream.
  const [local, setLocal] = useState<string>(() => valueToString(value))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local when external value changes (e.g. AI command or reset).
  useEffect(() => {
    setLocal(valueToString(value))
  }, [value])

  function handleChange(raw: string) {
    setLocal(raw)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const parsed = parseValue(raw, filterType)
      onChange(parsed, operator)
    }, DEBOUNCE_MS)
  }

  function handleClear() {
    setLocal('')
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange(null, operator)
  }

  const hasValue = local !== ''

  if (filterType === 'select') {
    return (
      <td className={styles.cell}>
        <select
          className={styles.input}
          value={local}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={`Filter by ${column.header}`}
        >
          <option value="">All</option>
          {column.filterOptions?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
    )
  }

  return (
    <td className={styles.cell}>
      <div className={styles.inputWrapper}>
        <input
          type={filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text'}
          className={styles.input}
          value={local}
          placeholder={`Filter…`}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={`Filter by ${column.header}`}
        />
        {hasValue && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label={`Clear ${column.header} filter`}
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </td>
  )
}

function valueToString(value: FilterEntry['value'] | null): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function parseValue(
  raw: string,
  filterType: NonNullable<ColumnDef<unknown>['filterType']>,
): FilterEntry['value'] | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  if (filterType === 'number') {
    const n = Number(trimmed)
    return isNaN(n) ? null : n
  }
  return trimmed
}
