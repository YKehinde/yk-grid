import React from 'react'
import { ColumnDef } from '../types'

interface Props<T> {
  column: ColumnDef<T>
  row: T
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void
}

export function Cell<T>({ column, row, onCellClick }: Props<T>) {
  const interactive = !!onCellClick
  const value = column.accessor(row)
  const rendered = column.cell ? column.cell(value, row) : String(value ?? '')

  return (
    <td
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation()
              onCellClick!(value, row, column, e)
            }
          : undefined
      }
      style={interactive ? { cursor: 'pointer' } : undefined}
    >
      {rendered}
    </td>
  )
}
