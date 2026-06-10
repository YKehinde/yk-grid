// Stub — implemented in phase 7.
import { ColumnDef } from '../types'

export function exportCsv<T>(rows: T[], columns: ColumnDef<T>[]): string {
  void rows
  void columns
  return ''
}

export function triggerCsvDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
