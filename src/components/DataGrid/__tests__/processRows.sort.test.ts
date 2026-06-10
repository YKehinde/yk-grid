import { describe, it, expect } from 'vitest'
import { processRows } from '../state/processRows'
import { ColumnDef } from '../types'

interface Row {
  id: string
  name: string
  amount: number | null
  date: Date | null
}

const cols: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount },
  { id: 'date', header: 'Date', accessor: (r) => r.date },
]

const noGroupState = { filters: [], grouping: [] }

const rows: Row[] = [
  { id: '1', name: 'Banana', amount: 30, date: new Date('2024-03-01') },
  { id: '2', name: 'apple', amount: 10, date: new Date('2024-01-01') },
  { id: '3', name: 'Cherry', amount: 20, date: new Date('2024-02-01') },
  { id: '4', name: 'date fruit', amount: null, date: null },
]

describe('processRows — sort', () => {
  it('returns rows unchanged when sorts is empty', () => {
    const result = processRows(rows, cols, { sorts: [], ...noGroupState })
    expect(result.map((r) => r.id)).toEqual(['1', '2', '3', '4'])
  })

  it('sorts strings ascending (case-insensitive)', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'name', direction: 'asc' }], ...noGroupState })
    expect(result.map((r) => r.name)).toEqual(['apple', 'Banana', 'Cherry', 'date fruit'])
  })

  it('sorts strings descending', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'name', direction: 'desc' }], ...noGroupState })
    expect(result.map((r) => r.name)).toEqual(['date fruit', 'Cherry', 'Banana', 'apple'])
  })

  it('sorts numbers ascending', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'amount', direction: 'asc' }], ...noGroupState })
    // null sorts last
    expect(result.map((r) => r.amount)).toEqual([10, 20, 30, null])
  })

  it('sorts numbers descending', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'amount', direction: 'desc' }], ...noGroupState })
    expect(result.map((r) => r.amount)).toEqual([30, 20, 10, null])
  })

  it('sorts dates ascending', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'date', direction: 'asc' }], ...noGroupState })
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1', '4'])
  })

  it('sorts dates descending', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'date', direction: 'desc' }], ...noGroupState })
    expect(result.map((r) => r.id)).toEqual(['1', '3', '2', '4'])
  })

  it('puts nulls last regardless of direction', () => {
    const asc = processRows(rows, cols, { sorts: [{ columnId: 'amount', direction: 'asc' }], ...noGroupState })
    const desc = processRows(rows, cols, { sorts: [{ columnId: 'amount', direction: 'desc' }], ...noGroupState })
    expect(asc.at(-1)!.amount).toBeNull()
    expect(desc.at(-1)!.amount).toBeNull()
  })

  it('applies multi-column sort in order', () => {
    const dupes: Row[] = [
      { id: 'a', name: 'Alpha', amount: 20, date: null },
      { id: 'b', name: 'Alpha', amount: 10, date: null },
      { id: 'c', name: 'Beta', amount: 5, date: null },
    ]
    const result = processRows(dupes, cols, {
      sorts: [
        { columnId: 'name', direction: 'asc' },
        { columnId: 'amount', direction: 'asc' },
      ],
      ...noGroupState,
    })
    expect(result.map((r) => r.id)).toEqual(['b', 'a', 'c'])
  })

  it('ignores sort entries for unknown column ids', () => {
    const result = processRows(rows, cols, { sorts: [{ columnId: 'nonexistent', direction: 'asc' }], ...noGroupState })
    expect(result.map((r) => r.id)).toEqual(['1', '2', '3', '4'])
  })

  it('does not mutate the original rows array', () => {
    const original = [...rows]
    processRows(rows, cols, { sorts: [{ columnId: 'name', direction: 'asc' }], ...noGroupState })
    expect(rows).toEqual(original)
  })
})
