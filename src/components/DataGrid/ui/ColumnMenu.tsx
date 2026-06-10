import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ColumnDef } from '../types'
import styles from './ColumnMenu.module.css'

interface Props<T> {
  columns: ColumnDef<T>[]
  columnVisibility: Record<string, boolean>
  anchorRect: DOMRect
  onToggleColumn: (columnId: string, visible: boolean) => void
  onClose: () => void
}

export function ColumnMenu<T>({ columns, columnVisibility, anchorRect, onToggleColumn, onClose }: Props<T>) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleScroll() { onClose() }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [onClose])

  const hideableColumns = columns.filter((c) => c.hideable !== false)

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ top: anchorRect.bottom + 2, left: anchorRect.left }}
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
    </div>,
    document.body,
  )
}
