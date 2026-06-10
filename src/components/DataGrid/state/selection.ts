// Resolves a selection set of ids back to source T[] — implemented in phase 6.
export function resolveSelection<T>(
  ids: Set<string>,
  rows: T[],
  getRowId: (row: T) => string,
): T[] {
  if (ids.size === 0) return []
  return rows.filter((row) => ids.has(getRowId(row)))
}
