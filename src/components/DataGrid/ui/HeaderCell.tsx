import React from 'react'
import { ColumnDef, SortEntry } from '../types'
import styles from './HeaderCell.module.css'

interface Props<T> {
  column: ColumnDef<T>
  sortEntry?: SortEntry
  sortIndex: number
  totalSorts: number
  onSort?: (columnId: string, multi: boolean) => void
}

const ARIA_SORT = {
  asc: 'ascending',
  desc: 'descending',
} as const

export function HeaderCell<T>({ column, sortEntry, sortIndex, totalSorts, onSort }: Props<T>) {
  const sortable = column.sortable !== false && !!onSort
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

  const ariaSortValue = direction ? ARIA_SORT[direction] : sortable ? 'none' : undefined

  return (
    <th
      style={{ width: column.width }}
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
    </th>
  )
}
