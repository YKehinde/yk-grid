import React, { forwardRef, useImperativeHandle, useMemo, useCallback, useRef, useEffect } from 'react'
import { DataGridProps, GridRef, ColumnDef, SortEntry, FilterEntry } from './types'
import { useGridState, buildInitialState } from './state/useGridState'
import { processRows } from './state/processRows'
import { paginateRows, pageCount } from './state/paginate'
import { resolveSelection } from './state/selection'
import { HeaderCell } from './ui/HeaderCell'
import { FilterControl } from './ui/FilterControl'
import { Row } from './ui/Row'
import { Pagination } from './ui/Pagination'
import { Toolbar } from './ui/Toolbar'
import styles from './DataGrid.module.css'

function DataGridInner<T>(
  {
    data,
    columns,
    getRowId,
    onRowClick,
    onCellClick,
    dataMode = 'server',
    pageSize = 20,
    rowCount,
    loading,
    onStateChange,
    selectionMode = 'none',
    emptyState,
    className,
    initialState,
  }: DataGridProps<T>,
  ref: React.ForwardedRef<GridRef<T>>,
) {
  const initState = useMemo(
    () => buildInitialState(initialState, pageSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const { state, dispatch } = useGridState(initState)

  // Updates or removes a single column's filter; leaves all others intact.
  const handleFilterChange = useCallback((
    columnId: string,
    value: FilterEntry['value'] | null,
    operator: FilterEntry['operator'],
  ) => {
    const isEmpty = value === null || value === '' || (Array.isArray(value) && value.length === 0)
    let next: FilterEntry[]
    if (isEmpty) {
      next = state.filters.filter((f) => f.columnId !== columnId)
    } else {
      const entry: FilterEntry = { columnId, operator, value: value as FilterEntry['value'] }
      const idx = state.filters.findIndex((f) => f.columnId === columnId)
      next = idx >= 0
        ? state.filters.map((f, i) => i === idx ? entry : f)
        : [...state.filters, entry]
    }
    dispatch({ type: 'SET_FILTER', filters: next })
  }, [state.filters, dispatch])

  // Cycles: none → asc → desc → none.
  // Shift-click adds to the multi-sort stack rather than replacing.
  const handleSort = useCallback((columnId: string, multi: boolean) => {
    const existing = state.sorts.find((s) => s.columnId === columnId)
    let next: SortEntry[]

    if (!existing) {
      const entry: SortEntry = { columnId, direction: 'asc' }
      next = multi ? [...state.sorts, entry] : [entry]
    } else if (existing.direction === 'asc') {
      next = state.sorts.map((s) => s.columnId === columnId ? { ...s, direction: 'desc' as const } : s)
    } else {
      // desc → remove
      next = state.sorts.filter((s) => s.columnId !== columnId)
    }

    dispatch({ type: 'SET_SORT', sorts: next })
  }, [state.sorts, dispatch])

  // Compute visible column ids from columnVisibility state
  const visibleColumnIds = useMemo(() => {
    const ids = new Set<string>()
    for (const col of columns) {
      const explicitlyHidden = state.columnVisibility[col.id] === false
      const defaultHidden = col.defaultHidden && state.columnVisibility[col.id] === undefined
      if (!explicitlyHidden && !defaultHidden) ids.add(col.id)
    }
    return ids
  }, [columns, state.columnVisibility])

  // In client mode: process + paginate locally. In server mode: render as-is.
  const processedRows = useMemo(() => {
    if (dataMode === 'server') return data
    return processRows(data, columns, state)
  }, [data, columns, state, dataMode])

  const displayRows = useMemo(() => {
    if (dataMode === 'server') return data
    return paginateRows(processedRows, state.pagination)
  }, [processedRows, data, state.pagination, dataMode])

  const totalRows = dataMode === 'server' ? (rowCount ?? 0) : processedRows.length
  const pages = pageCount(totalRows, state.pagination.pageSize)

  const selectedRows = useMemo(
    () => resolveSelection(state.selection, data, getRowId),
    [state.selection, data, getRowId],
  )

  // onStateChange fires only when the query (sorts/filters/grouping/pagination) changes —
  // not when selection, column sizing, or visibility change, as those don't need a refetch.
  // Use a ref for the callback to avoid adding it to the effect dependency array
  // (consumers often pass an inline function and we don't want to re-fire on every render).
  const onStateChangeRef = useRef(onStateChange)
  useEffect(() => { onStateChangeRef.current = onStateChange }, [onStateChange])

  const prevQueryRef = useRef<string | null>(null)
  useEffect(() => {
    if (dataMode !== 'server') return
    const queryStr = JSON.stringify({
      sorts: state.sorts,
      filters: state.filters,
      grouping: state.grouping,
      pagination: state.pagination,
    })
    if (queryStr === prevQueryRef.current) return
    prevQueryRef.current = queryStr
    onStateChangeRef.current?.(state)
  }, [state, dataMode])

  useImperativeHandle(ref, () => ({
    getSelectedRows: () => resolveSelection(state.selection, data, getRowId),
    getProcessedRows: () => processedRows as T[],
    getGridState: () => state,
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    exportCsv: () => { /* phase 7 */ },
    setState: (partial) => {
      if (partial.sorts) dispatch({ type: 'SET_SORT', sorts: partial.sorts })
      if (partial.filters) dispatch({ type: 'SET_FILTER', filters: partial.filters })
      if (partial.grouping) dispatch({ type: 'SET_GROUPING', grouping: partial.grouping })
    },
  }))

  const visibleColumns: ColumnDef<T>[] = columns.filter((c) => visibleColumnIds.has(c.id))

  const hasFilterableColumn = visibleColumns.some((c) => c.filterable !== false)

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <Toolbar />

      <div className={styles.tableContainer}>
        {loading && (
          <div className={styles.loadingOverlay} role="status" aria-label="Loading">
            <div className={styles.spinner} />
          </div>
        )}

        <table className={styles.table} role="grid">
          <thead>
            <tr>
              {visibleColumns.map((col) => {
                const sortIndex = state.sorts.findIndex((s) => s.columnId === col.id)
                return (
                  <HeaderCell
                    key={col.id}
                    column={col}
                    sortEntry={sortIndex >= 0 ? state.sorts[sortIndex] : undefined}
                    sortIndex={sortIndex}
                    totalSorts={state.sorts.length}
                    onSort={handleSort}
                  />
                )
              })}
            </tr>
            {hasFilterableColumn && (
              <tr className={styles.filterRow}>
                {visibleColumns.map((col) => {
                  const filterEntry = state.filters.find((f) => f.columnId === col.id)
                  return (
                    <FilterControl
                      key={col.id}
                      column={col}
                      value={filterEntry?.value ?? null}
                      onChange={(value, operator) => handleFilterChange(col.id, value, operator)}
                    />
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length}>
                  <div className={styles.emptyState}>
                    {emptyState ?? 'No data'}
                  </div>
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => (
                <Row
                  key={getRowId(row)}
                  row={row}
                  rowIndex={i}
                  columns={columns}
                  visibleColumnIds={visibleColumnIds}
                  onRowClick={onRowClick}
                  onCellClick={onCellClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pageIndex={state.pagination.pageIndex}
        pageCount={pages}
        pageSize={state.pagination.pageSize}
        totalRows={totalRows}
        onPageChange={(page) => dispatch({ type: 'SET_PAGE', pageIndex: page })}
        onPageSizeChange={(size) => dispatch({ type: 'SET_PAGE_SIZE', pageSize: size })}
      />

      {/* Expose selectedRows count for future toolbar — phase 7 */}
      {selectionMode !== 'none' && selectedRows.length > 0 && (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}

// forwardRef with generics requires a cast
export const DataGrid = forwardRef(DataGridInner) as <T>(
  props: DataGridProps<T> & { ref?: React.Ref<GridRef<T>> },
) => React.ReactElement
