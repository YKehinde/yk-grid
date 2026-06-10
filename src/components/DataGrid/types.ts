import React from 'react'

export interface ColumnDef<T> {
  id: string
  header: string
  accessor: (row: T) => string | number | Date | null
  cell?: (value: unknown, row: T) => React.ReactNode
  exportValue?: (row: T) => string | number
  sortable?: boolean
  filterable?: boolean
  groupable?: boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  filterType?: 'text' | 'number' | 'select' | 'date'
  filterOptions?: string[]   // required when filterType='select'
  width?: number
  minWidth?: number
  resizable?: boolean
  hideable?: boolean
  defaultHidden?: boolean
}

export interface SortEntry {
  columnId: string
  direction: 'asc' | 'desc'
}

export interface FilterEntry {
  columnId: string
  operator: 'eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in'
  value: string | number | Array<string | number>
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export interface GridState {
  sorts: SortEntry[]
  filters: FilterEntry[]
  grouping: string[]
  expanded: Set<string>
  selection: Set<string>
  pagination: PaginationState
  columnSizing: Record<string, number>
  columnVisibility: Record<string, boolean>
}

export interface DataGridProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  getRowId: (row: T) => string

  onRowClick?: (row: T, index: number, e: React.MouseEvent) => void
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void

  dataMode?: 'client' | 'server'
  pageSize?: number
  rowCount?: number
  loading?: boolean
  onStateChange?: (state: GridState) => void

  selectionMode?: 'none' | 'single' | 'multiple'
  selectAllScope?: 'page' | 'filtered'
  onSelectionChange?: (rows: T[], ids: string[]) => void

  enableCsvExport?: boolean
  csvFilename?: string

  enableColumnResize?: boolean
  enableColumnVisibility?: boolean

  toolbarActions?: (ctx: {
    selectedRows: T[]
    selectedIds: string[]
    processedRows: T[]
    gridState: GridState
    clearSelection: () => void
  }) => React.ReactNode

  fetchFilterOptions?: (columnId: string) => Promise<string[]>

  ai?: { endpoint: string; placeholder?: string }

  initialState?: Partial<GridState>
  emptyState?: React.ReactNode
  className?: string
}

// --- Display row types (used for rendering; includes group header rows) ---

export interface GroupHeaderRow {
  _type: 'group'
  id: string
  columnId: string
  value: string | number | Date | null
  depth: number
  childCount: number
  aggregates: Record<string, number | null>
  isExpanded: boolean
}

export interface DataDisplayRow<T> {
  _type: 'data'
  row: T
}

export type DisplayRow<T> = GroupHeaderRow | DataDisplayRow<T>

export interface GridRef<T> {
  getSelectedRows: () => T[]
  getProcessedRows: () => T[]
  getGridState: () => GridState
  clearSelection: () => void
  exportCsv: (opts?: { selectedOnly?: boolean }) => void
  setState: (partial: Partial<GridState>) => void
}
