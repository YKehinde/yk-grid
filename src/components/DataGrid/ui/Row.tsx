import React from 'react'
import { ColumnDef } from '../types'
import { Cell } from './Cell'

interface Props<T> {
  row: T
  rowIndex: number
  columns: ColumnDef<T>[]
  visibleColumnIds: Set<string>
  onRowClick?: (row: T, index: number, e: React.MouseEvent) => void
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void
}

export function Row<T>({ row, rowIndex, columns, visibleColumnIds, onRowClick, onCellClick }: Props<T>) {
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
      onClick={interactive ? (e) => onRowClick!(row, rowIndex, e) : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={interactive ? { cursor: 'pointer' } : undefined}
    >
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
