import React from 'react'
import styles from './SelectionCell.module.css'

interface Props {
  checked: boolean
  indeterminate?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  ariaLabel: string
  isHeader?: boolean
}

const SELECTION_CELL_STYLE: React.CSSProperties = {
  width: 40,
  minWidth: 40,
  maxWidth: 40,
}

export function SelectionCell({ checked, indeterminate, onChange, ariaLabel, isHeader = false }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!indeterminate
    }
  }, [indeterminate])

  const Tag = isHeader ? 'th' : 'td'

  return (
    <Tag
      className={styles.selectionCell}
      role={isHeader ? 'columnheader' : 'gridcell'}
      style={SELECTION_CELL_STYLE}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    </Tag>
  )
}
