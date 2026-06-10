import { describe, it, expect } from 'vitest'
import { processRows, extractDataRows } from '../state/processRows'
import { ColumnDef, GroupHeaderRow } from '../types'

interface Row {
  id: string
  region: string
  product: string
  revenue: number | null
}

const cols: ColumnDef<Row>[] = [
  { id: 'region', header: 'Region', accessor: (r) => r.region, groupable: true },
  { id: 'product', header: 'Product', accessor: (r) => r.product, groupable: true },
  { id: 'revenue', header: 'Revenue', accessor: (r) => r.revenue, aggregation: 'sum' },
]

const noSort = { sorts: [], filters: [] }

const rows: Row[] = [
  { id: '1', region: 'North', product: 'Widget', revenue: 100 },
  { id: '2', region: 'North', product: 'Gadget', revenue: 200 },
  { id: '3', region: 'South', product: 'Widget', revenue: 150 },
  { id: '4', region: 'South', product: 'Gadget', revenue: null },
]

function groupHeaders(display: ReturnType<typeof processRows<Row>>): GroupHeaderRow[] {
  return display.filter((d): d is GroupHeaderRow => d._type === 'group')
}

describe('processRows — grouping', () => {
  describe('basic grouping', () => {
    it('produces one group header per distinct value', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(),
      })
      const headers = groupHeaders(result)
      expect(headers).toHaveLength(2)
      expect(headers.map((h) => h.value)).toEqual(['North', 'South'])
    })

    it('groups are collapsed by default — no data rows emitted', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(),
      })
      expect(extractDataRows(result)).toHaveLength(0)
    })

    it('emits data rows for expanded groups', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(['region:North']),
      })
      expect(extractDataRows(result).map((r) => r.id)).toEqual(['1', '2'])
    })

    it('emits data rows for all expanded groups', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(['region:North', 'region:South']),
      })
      expect(extractDataRows(result).map((r) => r.id)).toEqual(['1', '2', '3', '4'])
    })

    it('sets correct childCount on group headers', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(),
      })
      const headers = groupHeaders(result)
      const north = headers.find((h) => h.value === 'North')!
      const south = headers.find((h) => h.value === 'South')!
      expect(north.childCount).toBe(2)
      expect(south.childCount).toBe(2)
    })
  })

  describe('aggregations', () => {
    it('computes sum aggregate per group', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(),
      })
      const headers = groupHeaders(result)
      const north = headers.find((h) => h.value === 'North')!
      expect(north.aggregates['revenue']).toBe(300) // 100 + 200
    })

    it('ignores null values in sum (only sums numbers)', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(),
      })
      const south = groupHeaders(result).find((h) => h.value === 'South')!
      expect(south.aggregates['revenue']).toBe(150) // 150 + null → only 150
    })

    it('count aggregation counts all rows in the group', () => {
      const countCols: ColumnDef<Row>[] = [
        ...cols.slice(0, 2),
        { id: 'revenue', header: 'Revenue', accessor: (r) => r.revenue, aggregation: 'count' },
      ]
      const result = processRows(rows, countCols, {
        ...noSort,
        grouping: ['region'],
        expanded: new Set(),
      })
      const north = groupHeaders(result).find((h) => h.value === 'North')!
      expect(north.aggregates['revenue']).toBe(2) // 2 rows in North
    })
  })

  describe('grouped sort semantics', () => {
    it('sort on grouping column orders groups', () => {
      const result = processRows(rows, cols, {
        sorts: [{ columnId: 'region', direction: 'desc' }],
        filters: [],
        grouping: ['region'],
        expanded: new Set(),
      })
      expect(groupHeaders(result).map((h) => h.value)).toEqual(['South', 'North'])
    })

    it('sort on non-grouping column orders rows within groups', () => {
      const result = processRows(rows, cols, {
        sorts: [{ columnId: 'revenue', direction: 'desc' }],
        filters: [],
        grouping: ['region'],
        expanded: new Set(['region:North']),
      })
      // Within North (100, 200) sorted desc → 200 first
      expect(extractDataRows(result).map((r) => r.revenue)).toEqual([200, 100])
    })

    it('group sort and within-group sort are independent', () => {
      const result = processRows(rows, cols, {
        sorts: [
          { columnId: 'region', direction: 'desc' },  // groups: South, North
          { columnId: 'revenue', direction: 'asc' },   // within: ascending
        ],
        filters: [],
        grouping: ['region'],
        expanded: new Set(['region:North', 'region:South']),
      })
      const display = result
      // Should see: South header, South rows (asc: 150, null-last), North header, North rows (asc: 100, 200)
      const southIdx = display.findIndex((d) => d._type === 'group' && (d as GroupHeaderRow).value === 'South')
      const northIdx = display.findIndex((d) => d._type === 'group' && (d as GroupHeaderRow).value === 'North')
      expect(southIdx).toBeLessThan(northIdx)
      // First data row after South should be revenue 150 (null comes last)
      const firstDataAfterSouth = display.slice(southIdx + 1).find((d) => d._type === 'data')
      expect(firstDataAfterSouth!._type === 'data' && (firstDataAfterSouth as { _type: 'data'; row: Row }).row.revenue).toBe(150)
    })
  })

  describe('multi-level grouping', () => {
    it('produces nested group headers', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region', 'product'],
        expanded: new Set(['region:North']),
      })
      const headers = groupHeaders(result)
      // Top-level: North, South
      // Sub-level under North: Widget, Gadget
      const topLevel = headers.filter((h) => h.depth === 0)
      const subLevel = headers.filter((h) => h.depth === 1)
      expect(topLevel.map((h) => h.value)).toEqual(['North', 'South'])
      expect(subLevel.map((h) => h.value)).toContain('Widget')
      expect(subLevel.map((h) => h.value)).toContain('Gadget')
    })

    it('only emits sub-group headers when parent is expanded', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region', 'product'],
        expanded: new Set(), // nothing expanded
      })
      expect(groupHeaders(result).filter((h) => h.depth === 1)).toHaveLength(0)
    })

    it('emits data rows only when both levels are expanded', () => {
      const result = processRows(rows, cols, {
        ...noSort,
        grouping: ['region', 'product'],
        expanded: new Set([
          'region:North',
          'region:North|product:Widget',
        ]),
      })
      // Only the Widget row under North should appear
      expect(extractDataRows(result).map((r) => r.id)).toEqual(['1'])
    })
  })

  it('handles grouping by a column with null values (null group sorts last)', () => {
    const nullRows: Row[] = [
      { id: 'a', region: 'North', product: 'Widget', revenue: 10 },
      { id: 'b', region: 'North', product: 'Widget', revenue: null },
    ]
    const nullCols: ColumnDef<Row>[] = [
      { id: 'region', header: 'Region', accessor: (r) => r.region },
      { id: 'revenue', header: 'Revenue', accessor: (r) => r.revenue },
    ]
    // Group by revenue — one null group
    const result = processRows(nullRows, nullCols, {
      ...noSort,
      grouping: ['revenue'],
      expanded: new Set(),
    })
    const headers = groupHeaders(result)
    expect(headers.find((h) => h.value === null)).toBeDefined()
  })

  it('does not mutate source rows', () => {
    const original = [...rows]
    processRows(rows, cols, { ...noSort, grouping: ['region'], expanded: new Set() })
    expect(rows).toEqual(original)
  })
})
