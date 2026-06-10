import { ColumnDef, GridState } from '../types'

type CellValue = string | number | Date | null

function compareNonNull(a: NonNullable<CellValue>, b: NonNullable<CellValue>): number {
  if (a instanceof Date && b instanceof Date) return a.valueOf() - b.valueOf()
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

// Phase 2: sort implemented.
// Phase 3: filter (stub).
// Phase 5: grouping (stub).
export function processRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  state: Pick<GridState, 'sorts' | 'filters' | 'grouping'>,
): T[] {
  let result = [...rows]

  // Phase 3 — filter will go here.

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
