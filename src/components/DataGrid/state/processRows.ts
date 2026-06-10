import { ColumnDef, DisplayRow, DataDisplayRow, GroupHeaderRow, FilterEntry, GridState } from '../types'
import { aggregate } from './aggregations'

export type CellValue = string | number | Date | null

function compareNonNull(a: NonNullable<CellValue>, b: NonNullable<CellValue>): number {
  if (a instanceof Date && b instanceof Date) return a.valueOf() - b.valueOf()
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

function toTimestamp(val: string | number): number {
  if (typeof val === 'number') return val
  const d = new Date(val)
  return isNaN(d.valueOf()) ? NaN : d.valueOf()
}

function matchesFilter(cellValue: CellValue, filter: FilterEntry): boolean {
  if (cellValue === null) return false
  const { operator, value: fv } = filter
  switch (operator) {
    case 'eq': {
      if (cellValue instanceof Date) return cellValue.toISOString().startsWith(String(fv))
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

// Sorting helper — nulls last, direction-aware.
function sortRows<T>(
  rows: T[],
  colMap: Map<string, ColumnDef<T>>,
  sorts: GridState['sorts'],
): T[] {
  if (sorts.length === 0) return rows
  return [...rows].sort((a, b) => {
    for (const { columnId, direction } of sorts) {
      const col = colMap.get(columnId)
      if (!col) continue
      const av = col.accessor(a)
      const bv = col.accessor(b)
      if (av === null && bv === null) continue
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = compareNonNull(av, bv)
      if (cmp !== 0) return direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

// Builds display rows for the grouped pipeline (recursive for nested grouping).
// Grouped-sort rule:
//   - sorts on a grouping column  → order groups
//   - sorts on a non-grouping column → order rows within each group
function buildGroupedDisplayRows<T>(
  rows: T[],
  colMap: Map<string, ColumnDef<T>>,
  state: Pick<GridState, 'sorts' | 'grouping' | 'expanded'>,
  depth: number,
  groupingIndex: number,
  parentId: string,
): DisplayRow<T>[] {
  const columnId = state.grouping[groupingIndex]
  const col = colMap.get(columnId)
  if (!col) return rows.map((row): DataDisplayRow<T> => ({ _type: 'data', row }))

  // Collect distinct groups preserving original typed values for sort.
  const groups: Array<{ key: string; value: CellValue; rows: T[] }> = []
  const keyToIndex = new Map<string, number>()

  for (const row of rows) {
    const val = col.accessor(row)
    const key = val === null
      ? '\x00null'
      : val instanceof Date ? val.toISOString() : String(val)
    if (!keyToIndex.has(key)) {
      keyToIndex.set(key, groups.length)
      groups.push({ key, value: val, rows: [] })
    }
    groups[keyToIndex.get(key)!].rows.push(row)
  }

  // Sort the groups if there's a sort on this grouping column.
  const groupSort = state.sorts.find((s) => s.columnId === columnId)
  if (groupSort) {
    groups.sort((a, b) => {
      if (a.value === null && b.value === null) return 0
      if (a.value === null) return 1
      if (b.value === null) return -1
      const cmp = compareNonNull(a.value, b.value)
      return groupSort.direction === 'asc' ? cmp : -cmp
    })
  }

  const result: DisplayRow<T>[] = []

  for (const group of groups) {
    // Compute per-group aggregates for all aggregation columns.
    const aggregates: Record<string, number | null> = {}
    for (const [cid, c] of colMap) {
      if (!c.aggregation) continue
      const values = c.aggregation === 'count'
        ? Array.from({ length: group.rows.length }, () => 1)
        : (group.rows.map((r) => c.accessor(r)).filter((v): v is number => typeof v === 'number'))
      aggregates[cid] = aggregate(values, c.aggregation)
    }

    const groupId = parentId
      ? `${parentId}|${columnId}:${group.key}`
      : `${columnId}:${group.key}`
    const isExpanded = state.expanded.has(groupId)

    const header: GroupHeaderRow = {
      _type: 'group',
      id: groupId,
      columnId,
      value: group.value,
      depth,
      childCount: group.rows.length,
      aggregates,
      isExpanded,
    }
    result.push(header)

    if (isExpanded) {
      if (groupingIndex + 1 < state.grouping.length) {
        // Recurse for the next grouping level.
        result.push(
          ...buildGroupedDisplayRows(
            group.rows, colMap, state, depth + 1, groupingIndex + 1, groupId,
          ),
        )
      } else {
        // Leaf level: sort rows by non-grouping-column sorts, then emit.
        const withinSorts = state.sorts.filter((s) => !state.grouping.includes(s.columnId))
        const sorted = sortRows(group.rows, colMap, withinSorts)
        result.push(...sorted.map((row): DataDisplayRow<T> => ({ _type: 'data', row })))
      }
    }
  }

  return result
}

// Returns filtered source rows only — no group headers.
// Used by GridRef.getProcessedRows() and CSV export.
export function filterSourceRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  filters: FilterEntry[],
): T[] {
  if (filters.length === 0) return rows
  const colMap = new Map(columns.map((c) => [c.id, c]))
  return rows.filter((row) =>
    filters.every((filter) => {
      const col = colMap.get(filter.columnId)
      if (!col) return true
      return matchesFilter(col.accessor(row), filter)
    }),
  )
}

// Full pipeline → display rows ready for rendering (includes group headers).
export function processRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  state: Pick<GridState, 'sorts' | 'filters' | 'grouping' | 'expanded'>,
): DisplayRow<T>[] {
  const colMap = new Map(columns.map((c) => [c.id, c]))
  const filtered = filterSourceRows(rows, columns, state.filters)

  if (state.grouping.length === 0) {
    const sorted = sortRows(filtered, colMap, state.sorts)
    return sorted.map((row): DataDisplayRow<T> => ({ _type: 'data', row }))
  }

  return buildGroupedDisplayRows(filtered, colMap, state, 0, 0, '')
}

// Convenience: extract source T[] from display rows (e.g. for tests or export).
export function extractDataRows<T>(displayRows: DisplayRow<T>[]): T[] {
  return displayRows
    .filter((dr): dr is DataDisplayRow<T> => dr._type === 'data')
    .map((dr) => dr.row)
}
