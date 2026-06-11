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
  editingColumnId?: string
  onStartEdit?: (rowId: string, columnId: string) => void
  onCommitEdit?: (newValue: string | number, row: T, column: ColumnDef<T>) => void
  onCancelEdit?: () => void
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
  editingColumnId,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: Props<T>) {
  const interactive = !!onRowClick
  const isEditingAnyCell = editingColumnId !== undefined

  const handleClick = interactive
    ? (e: React.MouseEvent) => {
        if (isEditingAnyCell) return
        onRowClick!(row, rowIndex, e)
      }
    : undefined

  const handleKeyDown = interactive
    ? (e: React.KeyboardEvent) => {
        if (isEditingAnyCell) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onRowClick!(row, rowIndex, e as unknown as React.MouseEvent)
        }
      }
    : undefined

  return (
    <tr
      aria-selected={selectionMode !== 'none' ? isSelected : undefined}
      onClick={handleClick}
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
            isEditing={editingColumnId === col.id}
            onStartEdit={onStartEdit ? () => onStartEdit(rowId, col.id) : undefined}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
          />
        ))}
    </tr>
  )
}
