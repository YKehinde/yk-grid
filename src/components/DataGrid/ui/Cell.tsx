import React, { useState, useEffect, useRef } from 'react'
import { ColumnDef } from '../types'
import styles from './Cell.module.css'

interface Props<T> {
  column: ColumnDef<T>
  row: T
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void
  isEditing?: boolean
  onStartEdit?: () => void
  onCommitEdit?: (newValue: string | number, row: T, column: ColumnDef<T>) => void
  onCancelEdit?: () => void
}

export function Cell<T>({
  column,
  row,
  onCellClick,
  isEditing = false,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: Props<T>) {
  const rawValue = column.accessor(row)
  const [inputValue, setInputValue] = useState('')
  const committedRef = useRef(false)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (isEditing) {
      setInputValue(rawValue === null ? '' : String(rawValue))
      committedRef.current = false
      cancelledRef.current = false
    }
  }, [isEditing, rawValue])

  const commit = () => {
    if (cancelledRef.current || committedRef.current) return
    committedRef.current = true
    const isNumber = column.filterType === 'number' || typeof rawValue === 'number'
    const committed: string | number = isNumber ? parseFloat(inputValue) || 0 : inputValue
    onCommitEdit?.(committed, row, column)
    onCancelEdit?.()
  }

  const cancel = () => {
    cancelledRef.current = true
    onCancelEdit?.()
  }

  if (isEditing) {
    const isNumber = column.filterType === 'number' || typeof rawValue === 'number'
    return (
      <td>
        <input
          className={styles.editInput}
          type={isNumber ? 'number' : 'text'}
          value={inputValue}
          aria-label={`Edit ${column.header}`}
          autoFocus
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              cancel()
            }
          }}
          onBlur={commit}
        />
      </td>
    )
  }

  const interactive = !!onCellClick
  const editable = !!column.editable && !!onStartEdit
  const rendered = column.cell ? column.cell(rawValue, row) : String(rawValue ?? '')

  return (
    <td
      className={editable ? styles.editable : undefined}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation()
              onCellClick!(rawValue, row, column, e)
            }
          : undefined
      }
      onDoubleClick={editable ? onStartEdit : undefined}
      style={interactive ? { cursor: 'pointer' } : undefined}
    >
      {rendered}
    </td>
  )
}
