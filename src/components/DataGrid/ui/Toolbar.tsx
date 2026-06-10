// Stub — selection count, export, column menu, and toolbarActions slot added in phases 7–8.
import React from 'react'
import styles from '../DataGrid.module.css'

interface Props {
  children?: React.ReactNode
}

export function Toolbar({ children }: Props) {
  return <div className={styles.toolbar}>{children}</div>
}
