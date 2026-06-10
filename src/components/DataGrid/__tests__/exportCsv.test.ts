import { describe, it, expect } from 'vitest'
import { exportCsv } from '../state/exportCsv'
import { ColumnDef } from '../types'

interface Row { id: string; name: string; amount: number | null }

const columns: ColumnDef<Row>[] = [
  { id: 'id', header: 'ID', accessor: (r) => r.id },
  { id: 'name', header: 'Name', accessor: (r) => r.name },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount },
]

describe('exportCsv', () => {
  it('produces a header row from column headers', () => {
    const csv = exportCsv([], columns)
    expect(csv).toBe('ID,Name,Amount')
  })

  it('produces one data row per source row', () => {
    const rows: Row[] = [
      { id: '1', name: 'Alice', amount: 100 },
      { id: '2', name: 'Bob', amount: 200 },
    ]
    const lines = exportCsv(rows, columns).split('\n')
    expect(lines).toHaveLength(3) // header + 2 rows
    expect(lines[1]).toBe('1,Alice,100')
    expect(lines[2]).toBe('2,Bob,200')
  })

  it('renders null values as empty strings', () => {
    const rows: Row[] = [{ id: '1', name: 'Alice', amount: null }]
    const lines = exportCsv(rows, columns).split('\n')
    expect(lines[1]).toBe('1,Alice,')
  })

  it('quotes cells that contain commas', () => {
    const rows: Row[] = [{ id: '1', name: 'Smith, John', amount: 10 }]
    const lines = exportCsv(rows, columns).split('\n')
    expect(lines[1]).toBe('1,"Smith, John",10')
  })

  it('escapes double-quotes by doubling them', () => {
    const rows: Row[] = [{ id: '1', name: 'say "hi"', amount: 10 }]
    const lines = exportCsv(rows, columns).split('\n')
    expect(lines[1]).toBe('1,"say ""hi""",10')
  })

  it('quotes cells that contain newlines', () => {
    const rows: Row[] = [{ id: '1', name: 'line1\nline2', amount: 10 }]
    const lines = exportCsv(rows, columns).split('\n')
    // The first data line includes the opening quote; line2 is part of the same field
    expect(lines[1]).toContain('"line1')
  })

  it('uses exportValue when provided', () => {
    const colsWithExport: ColumnDef<Row>[] = [
      { id: 'id', header: 'ID', accessor: (r) => r.id },
      { id: 'name', header: 'Name', accessor: (r) => r.name, exportValue: (r) => r.name.toUpperCase() },
      { id: 'amount', header: 'Amount', accessor: (r) => r.amount },
    ]
    const rows: Row[] = [{ id: '1', name: 'Alice', amount: 100 }]
    const lines = exportCsv(rows, colsWithExport).split('\n')
    expect(lines[1]).toBe('1,ALICE,100')
  })

  it('does not mutate the source rows array', () => {
    const rows: Row[] = [{ id: '1', name: 'Alice', amount: 100 }]
    const original = [...rows]
    exportCsv(rows, columns)
    expect(rows).toEqual(original)
  })
})
