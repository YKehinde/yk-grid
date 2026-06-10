import { describe, it, expect } from 'vitest'
import { paginateRows, pageCount } from '../state/paginate'

const rows = Array.from({ length: 55 }, (_, i) => ({ id: String(i + 1) }))

describe('paginateRows', () => {
  it('returns the first page', () => {
    const result = paginateRows(rows, { pageIndex: 0, pageSize: 20 })
    expect(result).toHaveLength(20)
    expect(result[0].id).toBe('1')
    expect(result[19].id).toBe('20')
  })

  it('returns a middle page', () => {
    const result = paginateRows(rows, { pageIndex: 1, pageSize: 20 })
    expect(result).toHaveLength(20)
    expect(result[0].id).toBe('21')
  })

  it('returns a partial last page', () => {
    const result = paginateRows(rows, { pageIndex: 2, pageSize: 20 })
    expect(result).toHaveLength(15)
    expect(result[0].id).toBe('41')
  })

  it('returns empty array for a page beyond the data', () => {
    const result = paginateRows(rows, { pageIndex: 10, pageSize: 20 })
    expect(result).toHaveLength(0)
  })

  it('returns all rows when pageSize >= total', () => {
    const result = paginateRows(rows, { pageIndex: 0, pageSize: 100 })
    expect(result).toHaveLength(55)
  })

  it('does not mutate the source array', () => {
    const source = [{ id: 'a' }, { id: 'b' }]
    paginateRows(source, { pageIndex: 0, pageSize: 10 })
    expect(source).toHaveLength(2)
  })
})

describe('pageCount', () => {
  it('returns ceil(total / pageSize)', () => {
    expect(pageCount(55, 20)).toBe(3)
    expect(pageCount(60, 20)).toBe(3)
    expect(pageCount(61, 20)).toBe(4)
  })

  it('returns 1 for 0 rows', () => {
    expect(pageCount(0, 20)).toBe(1)
  })

  it('returns 1 when total equals pageSize', () => {
    expect(pageCount(20, 20)).toBe(1)
  })

  it('returns 1 when total is less than pageSize', () => {
    expect(pageCount(5, 20)).toBe(1)
  })
})
