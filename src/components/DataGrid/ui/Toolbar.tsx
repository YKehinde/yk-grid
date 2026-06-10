import React from 'react'
import { GridState, ColumnDef } from '../types'
import styles from './Toolbar.module.css'

interface Props<T> {
  selectedRows: T[]
  selectedIds: string[]
  processedRows: T[]
  gridState: GridState
  clearSelection: () => void
  enableCsvExport?: boolean
  onExport?: () => void
  toolbarActions?: (ctx: {
    selectedRows: T[]
    selectedIds: string[]
    processedRows: T[]
    gridState: GridState
    clearSelection: () => void
  }) => React.ReactNode
  columns: ColumnDef<T>[]
}

export function Toolbar<T>({
  selectedRows,
  selectedIds,
  processedRows,
  gridState,
  clearSelection,
  enableCsvExport,
  onExport,
  toolbarActions,
  columns: _columns,
}: Props<T>) {
  const hasContent = enableCsvExport || !!toolbarActions || selectedRows.length > 0

  if (!hasContent) return null

  const ctx = { selectedRows, selectedIds, processedRows, gridState, clearSelection }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Grid toolbar">
      {selectedRows.length > 0 && (
        <span className={styles.selectionCount} aria-live="polite" aria-atomic="true">
          {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearSelection}
            aria-label="Clear selection"
          >
            ×
          </button>
        </span>
      )}

      {toolbarActions?.(ctx)}

      {enableCsvExport && (
        <button
          type="button"
          className={styles.exportBtn}
          onClick={onExport}
          aria-label="Export to CSV"
        >
          Export CSV
        </button>
      )}
    </div>
  )
}
