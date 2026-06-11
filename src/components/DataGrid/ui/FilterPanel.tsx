import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { ColumnDef, FilterEntry } from '../types'
import styles from './FilterPanel.module.css'

// --- Number filter types -------------------------------------------------

type NumberOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between'

const NUMBER_OPERATORS: { value: NumberOperator; label: string; symbol: string }[] = [
  { value: 'eq',      label: 'Equals',               symbol: '=' },
  { value: 'gt',      label: 'Greater than',          symbol: '>' },
  { value: 'gte',     label: 'Greater than or equal', symbol: '≥' },
  { value: 'lt',      label: 'Less than',             symbol: '<' },
  { value: 'lte',     label: 'Less than or equal',    symbol: '≤' },
  { value: 'between', label: 'Between',               symbol: '↔' },
]

function toNumberOp(op: FilterEntry['operator'] | null): NumberOperator {
  if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte' || op === 'between') return op
  return 'eq'
}

function parseNum(s: string): number | null {
  const trimmed = s.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return isNaN(n) ? null : n
}

// --- FilterPanel --------------------------------------------------------

interface Props<T> {
  column: ColumnDef<T>
  filterEntry: FilterEntry | undefined
  filterOptions?: string[]
  anchorRect: DOMRect
  onClose: () => void
  onChange: (value: FilterEntry['value'] | null, operator: FilterEntry['operator']) => void
}

const DEBOUNCE_MS = 300

export function FilterPanel<T>({
  column,
  filterEntry,
  filterOptions,
  anchorRect,
  onClose,
  onChange,
}: Props<T>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const headingId = useId()

  // Position below the anchor, clamped so it doesn't overflow the right viewport edge.
  const panelLeft = Math.min(
    anchorRect.left,
    typeof window !== 'undefined' ? window.innerWidth - 252 : anchorRect.left,
  )
  const panelStyle = {
    top: anchorRect.bottom + 6,
    left: Math.max(4, panelLeft),
  }

  // Close on outside pointerdown, Escape key, or scroll.
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleScroll() { onClose() }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [onClose])

  const filterType = column.filterType ?? 'text'

  return createPortal(
    <div
      ref={panelRef}
      className={styles.panel}
      style={panelStyle}
      role="dialog"
      aria-labelledby={headingId}
      aria-modal="false"
    >
      <p id={headingId} className={styles.heading}>
        Filter: {column.header}
      </p>

      {filterType === 'number' && (
        <NumberContent
          columnHeader={column.header}
          filterEntry={filterEntry}
          onChange={onChange}
        />
      )}

      {(filterType === 'text' || filterType === 'date') && (
        <TextContent
          columnHeader={column.header}
          filterType={filterType}
          filterEntry={filterEntry}
          onChange={onChange}
        />
      )}

      {filterType === 'select' && (
        <SelectContent
          columnHeader={column.header}
          options={filterOptions ?? column.filterOptions ?? []}
          filterEntry={filterEntry}
          onChange={onChange}
        />
      )}
    </div>,
    document.body,
  )
}

// --- Number content -------------------------------------------------------

function NumberContent({
  columnHeader,
  filterEntry,
  onChange,
}: {
  columnHeader: string
  filterEntry: FilterEntry | undefined
  onChange: (value: FilterEntry['value'] | null, operator: FilterEntry['operator']) => void
}) {
  const opId = useId()
  const valId = useId()

  const [op, setOp] = useState<NumberOperator>(() => toNumberOp(filterEntry?.operator ?? null))
  const [from, setFrom] = useState(() => {
    const v = filterEntry?.value
    if (v === null || v === undefined) return ''
    if (Array.isArray(v)) return v[0] !== undefined ? String(v[0]) : ''
    return String(v)
  })
  const [to, setTo] = useState(() => {
    const v = filterEntry?.value
    if (!Array.isArray(v)) return ''
    return v[1] !== undefined ? String(v[1]) : ''
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function fire(nextOp: NumberOperator, nextFrom: string, nextTo: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (nextOp === 'between') {
        const lo = parseNum(nextFrom)
        const hi = parseNum(nextTo)
        onChange(lo !== null && hi !== null ? [lo, hi] : null, 'between')
      } else {
        onChange(parseNum(nextFrom), nextOp)
      }
    }, DEBOUNCE_MS)
  }

  const hasValue = from !== '' || to !== ''

  return (
    <div className={styles.section}>
      <div className={styles.field}>
        <label htmlFor={opId} className={styles.label}>Operator</label>
        <select
          id={opId}
          className={styles.select}
          value={op}
          onChange={(e) => {
            const next = e.target.value as NumberOperator
            setOp(next)
            fire(next, from, to)
          }}
        >
          {NUMBER_OPERATORS.map((o) => (
            <option key={o.value} value={o.value}>{o.symbol}  {o.label}</option>
          ))}
        </select>
      </div>

      {op === 'between' ? (
        <div className={styles.field}>
          <label className={styles.label}>Range</label>
          <div className={styles.rangeRow}>
            <input
              type="number"
              className={styles.input}
              value={from}
              placeholder="Min"
              onChange={(e) => { setFrom(e.target.value); fire(op, e.target.value, to) }}
              aria-label={`Minimum value for ${columnHeader}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <span className={styles.rangeSep} aria-hidden="true">–</span>
            <input
              type="number"
              className={styles.input}
              value={to}
              placeholder="Max"
              onChange={(e) => { setTo(e.target.value); fire(op, from, e.target.value) }}
              aria-label={`Maximum value for ${columnHeader}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.field}>
          <label htmlFor={valId} className={styles.label}>Value</label>
          <input
            id={valId}
            type="number"
            className={styles.input}
            value={from}
            placeholder="Enter value…"
            onChange={(e) => { setFrom(e.target.value); fire(op, e.target.value, to) }}
            aria-label={`Filter value for ${columnHeader}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
      )}

      {hasValue && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
            setFrom(''); setTo('')
            onChange(null, op)
          }}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

// --- Text / date content --------------------------------------------------

function TextContent({
  columnHeader,
  filterType,
  filterEntry,
  onChange,
}: {
  columnHeader: string
  filterType: 'text' | 'date'
  filterEntry: FilterEntry | undefined
  onChange: (value: FilterEntry['value'] | null, operator: FilterEntry['operator']) => void
}) {
  const inputId = useId()
  const operator: FilterEntry['operator'] = filterType === 'date' ? 'eq' : 'contains'
  const initVal = filterEntry?.value != null ? String(filterEntry.value) : ''
  const [value, setValue] = useState(initVal)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function fire(raw: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(raw.trim() === '' ? null : raw.trim(), operator)
    }, DEBOUNCE_MS)
  }

  return (
    <div className={styles.section}>
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          {filterType === 'date' ? 'Date' : 'Contains'}
        </label>
        <input
          id={inputId}
          type={filterType === 'date' ? 'date' : 'text'}
          className={styles.input}
          value={value}
          placeholder={filterType === 'date' ? undefined : 'Filter…'}
          onChange={(e) => { setValue(e.target.value); fire(e.target.value) }}
          aria-label={`Filter ${columnHeader}`}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </div>

      {value !== '' && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
            setValue('')
            onChange(null, operator)
          }}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

// --- Select content -------------------------------------------------------

function getSelectedFromEntry(filterEntry: FilterEntry | undefined): Set<string> {
  if (!filterEntry) return new Set()
  const { value } = filterEntry
  if (Array.isArray(value)) return new Set(value.map(String))
  if (value !== null && value !== undefined && String(value) !== '') return new Set([String(value)])
  return new Set()
}

function SelectContent({
  columnHeader,
  options,
  filterEntry,
  onChange,
}: {
  columnHeader: string
  options: string[]
  filterEntry: FilterEntry | undefined
  onChange: (value: FilterEntry['value'] | null, operator: FilterEntry['operator']) => void
}) {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => getSelectedFromEntry(filterEntry))

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  )

  const allVisible = filtered.length > 0 && filtered.every((o) => selected.has(o))
  const someVisible = filtered.some((o) => selected.has(o))
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisible && !allVisible
    }
  }, [someVisible, allVisible])

  const commit = useCallback((next: Set<string>) => {
    setSelected(next)
    onChange(next.size > 0 ? Array.from(next) : null, 'in')
  }, [onChange])

  function handleSelectAll() {
    if (allVisible) {
      // Deselect all visible
      const next = new Set(selected)
      filtered.forEach((o) => next.delete(o))
      commit(next)
    } else {
      // Select all visible
      const next = new Set(selected)
      filtered.forEach((o) => next.add(o))
      commit(next)
    }
  }

  function handleToggle(option: string) {
    const next = new Set(selected)
    if (next.has(option)) next.delete(option)
    else next.add(option)
    commit(next)
  }

  return (
    <div className={styles.section}>
      <div className={styles.searchRow}>
        <label htmlFor={searchId} className={styles.srOnly}>Search {columnHeader} options</label>
        <span className={styles.searchIcon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={searchId}
          type="search"
          className={styles.searchInput}
          value={search}
          placeholder="Search…"
          onChange={(e) => setSearch(e.target.value)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </div>

      <div
        className={styles.checkboxList}
        role="group"
        aria-label={`Filter ${columnHeader} by value`}
      >
        {options.length > 0 && (
          <label className={styles.checkboxItem}>
            <input
              ref={selectAllRef}
              type="checkbox"
              className={styles.checkbox}
              checked={allVisible}
              onChange={handleSelectAll}
              aria-label="Select all"
            />
            <span className={styles.checkboxLabel}>(Select All)</span>
          </label>
        )}

        {filtered.length === 0 && (
          <p className={styles.noResults}>No matching options</p>
        )}

        {filtered.map((option) => (
          <label key={option} className={styles.checkboxItem}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={selected.has(option)}
              onChange={() => handleToggle(option)}
              aria-label={option}
            />
            <span className={styles.checkboxLabel}>{option}</span>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => commit(new Set())}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7.8" y1="7.8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
