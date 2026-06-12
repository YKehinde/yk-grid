import { ColumnDef } from '../types'

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Prefix formula-trigger characters so spreadsheet apps don't execute them as formulas.
  const safe = /^[=+\-@\t\r]/.test(str) ? `\t${str}` : str
  if (safe.includes(',') || safe.includes('\n') || safe.includes('"')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export function exportCsv<T>(rows: T[], columns: ColumnDef<T>[]): string {
  const exportableCols = columns.filter((c) => c.hideable !== true || c.defaultHidden !== true)

  const header = exportableCols.map((c) => csvCell(c.header)).join(',')

  const body = rows.map((row) =>
    exportableCols
      .map((col) => {
        const raw = col.exportValue ? col.exportValue(row) : col.accessor(row)
        const value = raw instanceof Date ? raw.toISOString() : raw
        return csvCell(value as string | number | null)
      })
      .join(','),
  )

  return [header, ...body].join('\n')
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
