import { ColumnDef, FilterEntry, GridState } from '../types'

export type CellValue = string | number | Date | null

function compareNonNull(a: NonNullable<CellValue>, b: NonNullable<CellValue>): number {
  if (a instanceof Date && b instanceof Date) return a.valueOf() - b.valueOf()
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

// Coerce a filter value (string | number) to a comparable number for Date/number columns.
function toTimestamp(val: string | number): number {
  if (typeof val === 'number') return val
  const d = new Date(val)
  return isNaN(d.valueOf()) ? NaN : d.valueOf()
}

function matchesFilter(cellValue: CellValue, filter: FilterEntry): boolean {
  // Null values never match any filter.
  if (cellValue === null) return false

  const { operator, value: fv } = filter

  switch (operator) {
    case 'eq': {
      if (cellValue instanceof Date) {
        // Date input produces "YYYY-MM-DD"; check ISO prefix so time part is ignored.
        return cellValue.toISOString().startsWith(String(fv))
      }
      if (typeof cellValue === 'number') return cellValue === Number(fv)
      return String(cellValue).toLowerCase() === String(fv).toLowerCase()
    }
    case 'contains':
      return String(cellValue).toLowerCase().includes(String(fv).toLowerCase())
    case 'gt': {
      if (cellValue instanceof Date) return cellValue.valueOf() > toTimestamp(fv as string | number)
      if (typeof cellValue === 'number') return cellValue > Number(fv)
      return String(cellValue).localeCompare(String(fv)) > 0
    }
    case 'lt': {
      if (cellValue instanceof Date) return cellValue.valueOf() < toTimestamp(fv as string | number)
      if (typeof cellValue === 'number') return cellValue < Number(fv)
      return String(cellValue).localeCompare(String(fv)) < 0
    }
    case 'between': {
      if (!Array.isArray(fv) || fv.length < 2) return true
      const [lo, hi] = fv as [string | number, string | number]
      if (cellValue instanceof Date) {
        const ts = cellValue.valueOf()
        return ts >= toTimestamp(lo) && ts <= toTimestamp(hi)
      }
      if (typeof cellValue === 'number') return cellValue >= Number(lo) && cellValue <= Number(hi)
      const s = String(cellValue).toLowerCase()
      return s >= String(lo).toLowerCase() && s <= String(hi).toLowerCase()
    }
    case 'in': {
      const candidates = (Array.isArray(fv) ? fv : [fv]) as Array<string | number>
      return candidates.some((v) => String(cellValue).toLowerCase() === String(v).toLowerCase())
    }
  }
}

// Phase 2: sort implemented.
// Phase 3: filter implemented.
// Phase 5: grouping (stub).
export function processRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  state: Pick<GridState, 'sorts' | 'filters' | 'grouping'>,
): T[] {
  let result = [...rows]

  if (state.filters.length > 0) {
    const colMap = new Map(columns.map((c) => [c.id, c]))
    result = result.filter((row) =>
      state.filters.every((filter) => {
        const col = colMap.get(filter.columnId)
        if (!col) return true  // unknown column — don't drop rows
        return matchesFilter(col.accessor(row), filter)
      }),
    )
  }

  // Phase 5 — grouping will go here.

  if (state.sorts.length > 0) {
    const colMap = new Map(columns.map((c) => [c.id, c]))
    result.sort((a, b) => {
      for (const { columnId, direction } of state.sorts) {
        const col = colMap.get(columnId)
        if (!col) continue
        const av = col.accessor(a)
        const bv = col.accessor(b)
        // Nulls last is independent of sort direction.
        if (av === null && bv === null) continue
        if (av === null) return 1
        if (bv === null) return -1
        const cmp = compareNonNull(av, bv)
        if (cmp !== 0) return direction === 'asc' ? cmp : -cmp
      }
      return 0
    })
  }

  return result
}
