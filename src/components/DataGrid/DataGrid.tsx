import React, { forwardRef, useImperativeHandle, useMemo } from 'react'
import { DataGridProps, GridRef, ColumnDef } from './types'
import { useGridState, buildInitialState } from './state/useGridState'
import { processRows } from './state/processRows'
import { paginateRows, pageCount } from './state/paginate'
import { resolveSelection } from './state/selection'
import { HeaderCell } from './ui/HeaderCell'
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

  // Notify parent of state changes in server mode
  React.useEffect(() => {
    if (dataMode === 'server') onStateChange?.(state)
  // Only fire when state changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, dataMode])

  const visibleColumns: ColumnDef<T>[] = columns.filter((c) => visibleColumnIds.has(c.id))

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <Toolbar />

      <div className={styles.tableContainer}>
        {loading && <div aria-live="polite" aria-label="Loading" />}

        <table className={styles.table} role="grid">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <HeaderCell key={col.id} column={col} />
              ))}
            </tr>
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
        onPageChange={(page) => dispatch({ type: 'SET_PAGE', pageIndex: page })}
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
