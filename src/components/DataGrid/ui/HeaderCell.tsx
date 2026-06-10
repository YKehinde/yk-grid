// Stub — sort toggle + resize handle implemented in phases 2 and 8.
import { ColumnDef } from '../types'

interface Props<T> {
  column: ColumnDef<T>
}

export function HeaderCell<T>({ column }: Props<T>) {
  return <th style={{ width: column.width }}>{column.header}</th>
}
