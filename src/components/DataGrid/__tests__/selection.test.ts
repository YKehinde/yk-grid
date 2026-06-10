import { describe, it, expect } from 'vitest'
import { gridReducer } from '../state/gridReducer'
import { resolveSelection } from '../state/selection'
import { GridState } from '../types'

interface Row { id: string; name: string }

const rows: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
]
const getRowId = (r: Row) => r.id

const baseState: GridState = {
  sorts: [],
  filters: [],
  grouping: [],
  expanded: new Set(),
  selection: new Set(),
  pagination: { pageIndex: 0, pageSize: 20 },
  columnSizing: {},
  columnVisibility: {},
}

describe('gridReducer — selection', () => {
  describe('TOGGLE_SELECT (multiple mode)', () => {
    it('adds a row id when not selected', () => {
      const next = gridReducer(baseState, { type: 'TOGGLE_SELECT', rowId: '1', mode: 'multiple' })
      expect(next.selection.has('1')).toBe(true)
    })

    it('removes a row id when already selected', () => {
      const withOne = { ...baseState, selection: new Set(['1']) }
      const next = gridReducer(withOne, { type: 'TOGGLE_SELECT', rowId: '1', mode: 'multiple' })
      expect(next.selection.has('1')).toBe(false)
    })

    it('accumulates multiple ids', () => {
      const s1 = gridReducer(baseState, { type: 'TOGGLE_SELECT', rowId: '1', mode: 'multiple' })
      const s2 = gridReducer(s1, { type: 'TOGGLE_SELECT', rowId: '2', mode: 'multiple' })
      expect(s2.selection).toEqual(new Set(['1', '2']))
    })
  })

  describe('TOGGLE_SELECT (single mode)', () => {
    it('selects a single row and clears others', () => {
      const withTwo = { ...baseState, selection: new Set(['1', '2']) }
      const next = gridReducer(withTwo, { type: 'TOGGLE_SELECT', rowId: '3', mode: 'single' })
      expect(next.selection).toEqual(new Set(['3']))
    })

    it('deselects when the same row is toggled again', () => {
      const withOne = { ...baseState, selection: new Set(['1']) }
      const next = gridReducer(withOne, { type: 'TOGGLE_SELECT', rowId: '1', mode: 'single' })
      expect(next.selection.size).toBe(0)
    })
  })

  describe('SELECT_ALL', () => {
    it('replaces selection with the given ids', () => {
      const withOne = { ...baseState, selection: new Set(['1']) }
      const next = gridReducer(withOne, { type: 'SELECT_ALL', rowIds: ['1', '2', '3'] })
      expect(next.selection).toEqual(new Set(['1', '2', '3']))
    })
  })

  describe('CLEAR_SELECTION', () => {
    it('empties the selection set', () => {
      const withTwo = { ...baseState, selection: new Set(['1', '2']) }
      const next = gridReducer(withTwo, { type: 'CLEAR_SELECTION' })
      expect(next.selection.size).toBe(0)
    })
  })
})

describe('resolveSelection', () => {
  it('returns an empty array when nothing is selected', () => {
    expect(resolveSelection(new Set(), rows, getRowId)).toEqual([])
  })

  it('returns matching rows in source order', () => {
    const result = resolveSelection(new Set(['3', '1']), rows, getRowId)
    expect(result.map((r) => r.id)).toEqual(['1', '3'])
  })

  it('ignores ids not present in rows', () => {
    const result = resolveSelection(new Set(['9', '1']), rows, getRowId)
    expect(result.map((r) => r.id)).toEqual(['1'])
  })
})
