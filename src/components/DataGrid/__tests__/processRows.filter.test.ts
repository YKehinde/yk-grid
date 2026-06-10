import { describe, it, expect } from 'vitest'
import { processRows, extractDataRows } from '../state/processRows'
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

const noSortGroup = { sorts: [], grouping: [], expanded: new Set<string>() }

const rows: Row[] = [
  { id: '1', name: 'Apple', amount: 10, status: 'active', date: new Date('2024-01-15') },
  { id: '2', name: 'Banana', amount: 30, status: 'inactive', date: new Date('2024-03-01') },
  { id: '3', name: 'Apricot', amount: 20, status: 'active', date: new Date('2024-02-01') },
  { id: '4', name: 'Cherry', amount: null, status: 'inactive', date: null },
]

function run(filters: Parameters<typeof processRows<Row>>[2]['filters']) {
  return extractDataRows(processRows(rows, cols, { filters, ...noSortGroup }))
}

describe('processRows — filter', () => {
  it('returns all rows when filters is empty', () => {
    expect(run([])).toHaveLength(4)
  })

  describe('contains', () => {
    it('matches case-insensitively', () => {
      expect(run([{ columnId: 'name', operator: 'contains', value: 'ap' }]).map((r) => r.name))
        .toEqual(['Apple', 'Apricot'])
    })

    it('returns empty when no match', () => {
      expect(run([{ columnId: 'name', operator: 'contains', value: 'zzz' }])).toHaveLength(0)
    })
  })

  describe('eq', () => {
    it('matches exact string (case-insensitive)', () => {
      expect(run([{ columnId: 'status', operator: 'eq', value: 'Active' }]).map((r) => r.id))
        .toEqual(['1', '3'])
    })

    it('matches exact number', () => {
      expect(run([{ columnId: 'amount', operator: 'eq', value: 20 }]).map((r) => r.id))
        .toEqual(['3'])
    })

    it('matches date by ISO prefix', () => {
      expect(run([{ columnId: 'date', operator: 'eq', value: '2024-01-15' }]).map((r) => r.id))
        .toEqual(['1'])
    })
  })

  describe('gt / gte / lt / lte', () => {
    it('gt filters numbers strictly greater than value', () => {
      expect(run([{ columnId: 'amount', operator: 'gt', value: 15 }]).map((r) => r.id))
        .toEqual(['2', '3'])
    })

    it('gte includes the boundary value', () => {
      expect(run([{ columnId: 'amount', operator: 'gte', value: 20 }]).map((r) => r.id))
        .toEqual(['2', '3'])
    })

    it('lt filters numbers strictly less than value', () => {
      expect(run([{ columnId: 'amount', operator: 'lt', value: 25 }]).map((r) => r.id))
        .toEqual(['1', '3'])
    })

    it('lte includes the boundary value', () => {
      expect(run([{ columnId: 'amount', operator: 'lte', value: 20 }]).map((r) => r.id))
        .toEqual(['1', '3'])
    })

    it('gt excludes the boundary value', () => {
      expect(run([{ columnId: 'amount', operator: 'gt', value: 20 }]).map((r) => r.id))
        .toEqual(['2'])
    })

    it('lt excludes the boundary value', () => {
      expect(run([{ columnId: 'amount', operator: 'lt', value: 20 }]).map((r) => r.id))
        .toEqual(['1'])
    })
  })

  describe('between', () => {
    it('keeps rows within inclusive range', () => {
      expect(run([{ columnId: 'amount', operator: 'between', value: [10, 20] }]).map((r) => r.id))
        .toEqual(['1', '3'])
    })

    it('passes through non-null rows when filter value is malformed (not an array)', () => {
      // Row 4 has null amount — nulls never match. The 3 non-null rows should pass through.
      expect(run([{ columnId: 'amount', operator: 'between', value: 10 }])).toHaveLength(3)
    })
  })

  describe('in', () => {
    it('keeps rows whose value is in the set', () => {
      expect(run([{ columnId: 'status', operator: 'in', value: ['active', 'inactive'] }])).toHaveLength(4)
    })

    it('filters to matching values', () => {
      expect(run([{ columnId: 'status', operator: 'in', value: ['active'] }]).map((r) => r.id))
        .toEqual(['1', '3'])
    })
  })

  describe('null handling', () => {
    it('excludes rows with null cell values from any filter', () => {
      expect(run([{ columnId: 'amount', operator: 'gt', value: 0 }]).map((r) => r.id))
        .not.toContain('4')
    })
  })

  describe('multiple filters', () => {
    it('applies all filters as AND', () => {
      expect(run([
        { columnId: 'status', operator: 'eq', value: 'active' },
        { columnId: 'amount', operator: 'gt', value: 15 },
      ]).map((r) => r.id)).toEqual(['3'])
    })
  })

  it('ignores filters for unknown column ids', () => {
    expect(run([{ columnId: 'nonexistent', operator: 'eq', value: 'x' }])).toHaveLength(4)
  })

  it('does not mutate the original rows array', () => {
    const original = [...rows]
    processRows(rows, cols, { filters: [{ columnId: 'name', operator: 'contains', value: 'Apple' }], ...noSortGroup })
    expect(rows).toEqual(original)
  })
})
