import { PaginationState } from '../types'

export function paginateRows<T>(rows: T[], pagination: PaginationState): T[] {
  const { pageIndex, pageSize } = pagination
  const start = pageIndex * pageSize
  return rows.slice(start, start + pageSize)
}

export function pageCount(totalRows: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalRows / pageSize))
}
