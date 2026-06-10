import { useState, useEffect, useRef } from 'react'
import { FilterEntry } from '../types'
import styles from './NumberFilter.module.css'

type NumberOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between'

const OPERATORS: { value: NumberOperator; label: string; symbol: string }[] = [
  { value: 'eq',      label: 'Equals',                symbol: '=' },
  { value: 'gt',      label: 'Greater than',           symbol: '>' },
  { value: 'gte',     label: 'Greater than or equal',  symbol: '≥' },
  { value: 'lt',      label: 'Less than',              symbol: '<' },
  { value: 'lte',     label: 'Less than or equal',     symbol: '≤' },
  { value: 'between', label: 'Between',                symbol: '↔' },
]

const DEBOUNCE_MS = 300

interface Props {
  columnHeader: string
  value: FilterEntry['value'] | null
  operator: FilterEntry['operator'] | null
  onChange: (value: FilterEntry['value'] | null, operator: FilterEntry['operator']) => void
}

export function NumberFilter({ columnHeader, value, operator: externalOperator, onChange }: Props) {
  const [op, setOp] = useState<NumberOperator>(() => toNumberOp(externalOperator))
  const [from, setFrom] = useState<string>(() => initFrom(value))
  const [to, setTo] = useState<string>(() => initTo(value))
  const [menuOpen, setMenuOpen] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sync from external state changes (AI command, GridRef.setState, etc.).
  // op is only overwritten when an external operator is explicitly present —
  // null means the filter was cleared, so we preserve the user's picker choice.
  useEffect(() => {
    if (externalOperator !== null) {
      setOp(toNumberOp(externalOperator))
    }
    setFrom(initFrom(value))
    setTo(initTo(value))
  }, [value, externalOperator])

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  function fire(nextOp: NumberOperator, nextFrom: string, nextTo: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (nextOp === 'between') {
        const lo = parseNum(nextFrom)
        const hi = parseNum(nextTo)
        if (lo !== null && hi !== null) onChange([lo, hi], 'between')
        else onChange(null, 'between')
      } else {
        const n = parseNum(nextFrom)
        onChange(n, nextOp)
      }
    }, DEBOUNCE_MS)
  }

  function handleOperatorSelect(next: NumberOperator) {
    setOp(next)
    setMenuOpen(false)
    // Reset to field when switching away from between, keep from value
    fire(next, from, to)
  }

  function handleFromChange(raw: string) {
    setFrom(raw)
    fire(op, raw, to)
  }

  function handleToChange(raw: string) {
    setTo(raw)
    fire(op, from, raw)
  }

  function handleClear() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFrom('')
    setTo('')
    onChange(null, op)
  }

  const hasValue = from !== '' || to !== ''
  const current = OPERATORS.find((o) => o.value === op)!

  return (
    <div className={styles.wrapper}>
      <div className={styles.operatorWrapper} ref={menuRef}>
        <button
          type="button"
          className={[styles.operatorBtn, menuOpen && styles.operatorBtnOpen].filter(Boolean).join(' ')}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Filter operator: ${current.label}`}
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
          title={current.label}
        >
          {current.symbol}
        </button>
        {menuOpen && (
          <ul className={styles.menu} role="listbox" aria-label="Filter operator">
            {OPERATORS.map((o) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === op}
                className={[styles.menuItem, o.value === op && styles.menuItemActive].filter(Boolean).join(' ')}
                onClick={() => handleOperatorSelect(o.value)}
              >
                <span className={styles.menuSymbol}>{o.symbol}</span>
                <span>{o.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.inputs}>
        <input
          type="number"
          className={styles.input}
          value={from}
          placeholder={op === 'between' ? 'Min' : 'Value'}
          onChange={(e) => handleFromChange(e.target.value)}
          aria-label={op === 'between' ? `Minimum value for ${columnHeader}` : `Filter by ${columnHeader}`}
        />
        {op === 'between' && (
          <>
            <span className={styles.rangeSep}>–</span>
            <input
              type="number"
              className={styles.input}
              value={to}
              placeholder="Max"
              onChange={(e) => handleToChange(e.target.value)}
              aria-label={`Maximum value for ${columnHeader}`}
            />
          </>
        )}
      </div>

      {hasValue && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={handleClear}
          aria-label={`Clear ${columnHeader} filter`}
        >
          ×
        </button>
      )}
    </div>
  )
}

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

function initFrom(value: FilterEntry['value'] | null): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value[0] !== undefined ? String(value[0]) : ''
  return String(value)
}

function initTo(value: FilterEntry['value'] | null): string {
  if (!Array.isArray(value)) return ''
  return value[1] !== undefined ? String(value[1]) : ''
}
