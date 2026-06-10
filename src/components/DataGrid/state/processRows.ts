import { ColumnDef, GridState } from '../types'

// Stub — full implementation in phase 2 (sort) and phase 3 (filter) and phase 5 (grouping).
// Returns source rows unchanged for the skeleton phase.
export function processRows<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  state: Pick<GridState, 'sorts' | 'filters' | 'grouping'>,
): T[] {
  void columns
  void state
  return rows
}
