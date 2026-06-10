import { useEffect, useRef } from 'react'
import { ColumnDef } from '../types'
import styles from './ColumnMenu.module.css'

interface Props<T> {
  columns: ColumnDef<T>[]
  columnVisibility: Record<string, boolean>
  onToggleColumn: (columnId: string, visible: boolean) => void
  onClose: () => void
}

export function ColumnMenu<T>({ columns, columnVisibility, onToggleColumn, onClose }: Props<T>) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const hideableColumns = columns.filter((c) => c.hideable !== false)

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="dialog"
      aria-label="Column visibility"
    >
      <p className={styles.heading}>Columns</p>
      <ul className={styles.list} role="list">
        {hideableColumns.map((col) => {
          const isVisible = columnVisibility[col.id] !== false && !(col.defaultHidden && columnVisibility[col.id] === undefined)
          return (
            <li key={col.id} className={styles.item}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isVisible}
                  onChange={() => onToggleColumn(col.id, !isVisible)}
                />
                {col.header}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
