import React from 'react'
import { ColumnDef } from '../types'
import { Cell } from './Cell'
import { SelectionCell } from './SelectionCell'

interface Props<T> {
  row: T
  rowIndex: number
  rowId: string
  columns: ColumnDef<T>[]
  visibleColumnIds: Set<string>
  selectionMode?: 'none' | 'single' | 'multiple'
  isSelected?: boolean
  onToggleSelect?: (rowId: string) => void
  onRowClick?: (row: T, index: number, e: React.MouseEvent) => void
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void
}

export function Row<T>({
  row,
  rowIndex,
  rowId,
  columns,
  visibleColumnIds,
  selectionMode = 'none',
  isSelected = false,
  onToggleSelect,
  onRowClick,
  onCellClick,
}: Props<T>) {
  const interactive = !!onRowClick

  const handleKeyDown = interactive
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onRowClick!(row, rowIndex, e as unknown as React.MouseEvent)
        }
      }
    : undefined

  return (
    <tr
      aria-selected={selectionMode !== 'none' ? isSelected : undefined}
      onClick={interactive ? (e) => onRowClick!(row, rowIndex, e) : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={interactive ? { cursor: 'pointer' } : undefined}
    >
      {selectionMode !== 'none' && (
        <SelectionCell
          checked={isSelected}
          onChange={() => onToggleSelect?.(rowId)}
          ariaLabel={isSelected ? 'Deselect row' : 'Select row'}
        />
      )}
      {columns
        .filter((col) => visibleColumnIds.has(col.id))
        .map((col) => (
          <Cell
            key={col.id}
            column={col}
            row={row}
            onCellClick={onCellClick}
          />
        ))}
    </tr>
  )
}
