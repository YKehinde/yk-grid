import React from 'react'
import { ColumnDef, SortEntry } from '../types'
import styles from './HeaderCell.module.css'

interface Props<T> {
  column: ColumnDef<T>
  sortEntry?: SortEntry
  sortIndex: number
  totalSorts: number
  width?: number
  onSort?: (columnId: string, multi: boolean) => void
  enableResize?: boolean
  onResize?: (columnId: string, width: number) => void
  enableMenu?: boolean
  menuOpen?: boolean
  onToggleMenu?: (columnId: string) => void
  columnMenuSlot?: React.ReactNode
}

const ARIA_SORT = {
  asc: 'ascending',
  desc: 'descending',
} as const

export function HeaderCell<T>({
  column,
  sortEntry,
  sortIndex,
  totalSorts,
  width,
  onSort,
  enableResize,
  onResize,
  enableMenu,
  menuOpen,
  onToggleMenu,
  columnMenuSlot,
}: Props<T>) {
  const sortable = column.sortable !== false && !!onSort
  const resizable = enableResize && column.resizable !== false && !!onResize
  const direction = sortEntry?.direction

  function handleClick(e: React.MouseEvent) {
    if (!sortable) return
    onSort!(column.id, e.shiftKey)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!sortable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSort!(column.id, e.shiftKey)
    }
  }

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const thEl = (e.target as HTMLElement).closest('th')!
    const startWidth = thEl.getBoundingClientRect().width

    function onMouseMove(mv: MouseEvent) {
      const delta = mv.clientX - startX
      const next = Math.max(column.minWidth ?? 50, startWidth + delta)
      onResize!(column.id, Math.round(next))
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const ariaSortValue = direction ? ARIA_SORT[direction] : sortable ? 'none' : undefined
  const effectiveWidth = width ?? column.width

  return (
    <th
      style={{ width: effectiveWidth, position: 'relative' }}
      aria-sort={ariaSortValue}
      onClick={sortable ? handleClick : undefined}
      onKeyDown={sortable ? handleKeyDown : undefined}
      tabIndex={sortable ? 0 : undefined}
      role={sortable ? 'columnheader' : undefined}
      className={[styles.th, sortable && styles.sortable].filter(Boolean).join(' ')}
    >
      <span className={styles.label}>{column.header}</span>
      {sortable && (
        <span className={styles.indicators} aria-hidden="true">
          {direction === 'asc' && <span className={styles.arrow}>↑</span>}
          {direction === 'desc' && <span className={styles.arrow}>↓</span>}
          {!direction && <span className={styles.arrowIdle}>↕</span>}
          {totalSorts > 1 && sortIndex >= 0 && (
            <span className={styles.sortIndex}>{sortIndex + 1}</span>
          )}
        </span>
      )}
      {enableMenu && column.hideable !== false && (
        <button
          type="button"
          className={[styles.menuBtn, menuOpen && styles.menuBtnOpen].filter(Boolean).join(' ')}
          onClick={(e) => { e.stopPropagation(); onToggleMenu?.(column.id) }}
          aria-label={`Column options for ${column.header}`}
          aria-expanded={menuOpen}
          tabIndex={-1}
        >
          ⋮
        </button>
      )}
      {resizable && (
        <span
          className={styles.resizeHandle}
          onMouseDown={handleResizeMouseDown}
          role="separator"
          aria-label={`Resize ${column.header}`}
          aria-orientation="vertical"
        />
      )}
      {columnMenuSlot}
    </th>
  )
}
