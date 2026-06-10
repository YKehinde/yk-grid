import { describe, it, expect } from 'vitest'
import { processRows } from '../state/processRows'
import { ColumnDef } from '../types'

interface Row {
  id: string
  name: string
  amount: number | null
  status: string
  date: Date | null
}

const cols: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount },
  { id: 'status', header: 'Status', accessor: (r) => r.status },
  { id: 'date', header: 'Date', accessor: (r) => r.date },
]

const noSortGroup = { sorts: [], grouping: [] }

const rows: Row[] = [
  { id: '1', name: 'Apple', amount: 10, status: 'active', date: new Date('2024-01-15') },
  { id: '2', name: 'Banana', amount: 30, status: 'inactive', date: new Date('2024-03-01') },
  { id: '3', name: 'Apricot', amount: 20, status: 'active', date: new Date('2024-02-01') },
  { id: '4', name: 'Cherry', amount: null, status: 'inactive', date: null },
]

describe('processRows — filter', () => {
  it('returns all rows when filters is empty', () => {
    const result = processRows(rows, cols, { filters: [], ...noSortGroup })
    expect(result).toHaveLength(4)
  })

  describe('contains', () => {
    it('matches case-insensitively', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'name', operator: 'contains', value: 'ap' }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.name)).toEqual(['Apple', 'Apricot'])
    })

    it('returns empty when no match', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'name', operator: 'contains', value: 'zzz' }],
        ...noSortGroup,
      })
      expect(result).toHaveLength(0)
    })
  })

  describe('eq', () => {
    it('matches exact string (case-insensitive)', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'status', operator: 'eq', value: 'Active' }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['1', '3'])
    })

    it('matches exact number', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'amount', operator: 'eq', value: 20 }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['3'])
    })

    it('matches date by ISO prefix', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'date', operator: 'eq', value: '2024-01-15' }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['1'])
    })
  })

  describe('gt / lt', () => {
    it('gt filters numbers greater than value', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'amount', operator: 'gt', value: 15 }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['2', '3'])
    })

    it('lt filters numbers less than value', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'amount', operator: 'lt', value: 25 }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['1', '3'])
    })
  })

  describe('between', () => {
    it('keeps rows within inclusive range', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'amount', operator: 'between', value: [10, 20] }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['1', '3'])
    })

    it('passes through non-null rows when filter value is malformed (not an array)', () => {
      // Row 4 has null amount — nulls never match. The 3 non-null rows should pass through.
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'amount', operator: 'between', value: 10 }],
        ...noSortGroup,
      })
      expect(result).toHaveLength(3)
    })
  })

  describe('in', () => {
    it('keeps rows whose value is in the set', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'status', operator: 'in', value: ['active', 'inactive'] }],
        ...noSortGroup,
      })
      expect(result).toHaveLength(4)
    })

    it('filters to matching values', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'status', operator: 'in', value: ['active'] }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['1', '3'])
    })
  })

  describe('null handling', () => {
    it('excludes rows with null cell values from any filter', () => {
      const result = processRows(rows, cols, {
        filters: [{ columnId: 'amount', operator: 'gt', value: 0 }],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).not.toContain('4')
    })
  })

  describe('multiple filters', () => {
    it('applies all filters as AND', () => {
      const result = processRows(rows, cols, {
        filters: [
          { columnId: 'status', operator: 'eq', value: 'active' },
          { columnId: 'amount', operator: 'gt', value: 15 },
        ],
        ...noSortGroup,
      })
      expect(result.map((r) => r.id)).toEqual(['3'])
    })
  })

  it('ignores filters for unknown column ids', () => {
    const result = processRows(rows, cols, {
      filters: [{ columnId: 'nonexistent', operator: 'eq', value: 'x' }],
      ...noSortGroup,
    })
    expect(result).toHaveLength(4)
  })

  it('does not mutate the original rows array', () => {
    const original = [...rows]
    processRows(rows, cols, {
      filters: [{ columnId: 'name', operator: 'contains', value: 'Apple' }],
      ...noSortGroup,
    })
    expect(rows).toEqual(original)
  })
})
