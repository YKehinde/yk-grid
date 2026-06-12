---
title: Type reference
---

# Type reference

All types are exported from the `yk-grid` package.

```ts
import type {
  ColumnDef,
  DataGridProps,
  GridState,
  GridRef,
  SortEntry,
  FilterEntry,
  PaginationState,
  GroupHeaderRow,
  DataDisplayRow,
  DisplayRow,
} from 'yk-grid'
```

---

## `ColumnDef<T>`

Defines a column in the grid.

```ts
interface ColumnDef<T> {
  // Required
  id:       string
  header:   string
  accessor: (row: T) => string | number | Date | null

  // Rendering
  cell?:        (value: unknown, row: T) => ReactNode
  exportValue?: (row: T) => string | number

  // Features
  sortable?:    boolean
  filterable?:  boolean
  groupable?:   boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'

  // Filter
  filterType?:    'text' | 'number' | 'select' | 'date'
  filterOptions?: string[]

  // Sizing & visibility
  width?:         number
  minWidth?:      number
  resizable?:     boolean
  hideable?:      boolean
  defaultHidden?: boolean
}
```

---

## `DataGridProps<T>`

All props accepted by `<DataGrid<T> />`.

```ts
interface DataGridProps<T> {
  // Required
  data:      T[]
  columns:   ColumnDef<T>[]
  getRowId:  (row: T) => string

  // Click handlers
  onRowClick?:  (row: T, index: number, e: React.MouseEvent) => void
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void

  // Data mode
  dataMode?:      'client' | 'server'    // default: 'server'
  pageSize?:      number                 // default: 20
  rowCount?:      number                 // required in server mode for pagination
  loading?:       boolean                // default: false
  onStateChange?: (state: GridState) => void

  // Selection
  selectionMode?:      'none' | 'single' | 'multiple'  // default: 'none'
  selectAllScope?:     'page' | 'filtered'              // default: 'page'
  onSelectionChange?:  (rows: T[], ids: string[]) => void

  // Export
  enableCsvExport?: boolean   // default: false
  csvFilename?:     string    // default: 'export.csv'

  // Column features
  enableColumnResize?:     boolean  // default: false
  enableColumnVisibility?: boolean  // default: false

  // Toolbar
  toolbarActions?: (ctx: {
    selectedRows:   T[]
    selectedIds:    string[]
    processedRows:  T[]
    gridState:      GridState
    clearSelection: () => void
  }) => React.ReactNode

  // Filtering
  fetchFilterOptions?: (columnId: string) => Promise<string[]>

  // AI
  ai?: { endpoint: string; placeholder?: string }

  // Virtual scrolling
  height?:              number | string
  estimatedRowHeight?:  number  // default: 41

  // Other
  initialState?: Partial<GridState>
  emptyState?:   React.ReactNode
  className?:    string
}
```

---

## `GridState`

The complete state snapshot of the grid.

```ts
interface GridState {
  sorts:            SortEntry[]
  filters:          FilterEntry[]
  grouping:         string[]                    // column IDs in order
  expanded:         Set<string>                 // group IDs that are open
  selection:        Set<string>                 // selected row IDs
  pagination:       PaginationState
  columnSizing:     Record<string, number>      // columnId → width in px
  columnVisibility: Record<string, boolean>     // columnId → visible
}
```

---

## `SortEntry`

```ts
interface SortEntry {
  columnId:  string
  direction: 'asc' | 'desc'
}
```

---

## `FilterEntry`

```ts
interface FilterEntry {
  columnId: string
  operator: 'eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in'
  value:    string | number | Array<string | number>
}
```

Valid `operator` / `value` combinations:

| Operator | `value` type | Filter types |
|----------|-------------|--------------|
| `eq` | `string \| number` | text, number, select, date |
| `contains` | `string` | text |
| `gt` `gte` `lt` `lte` | `string \| number` | number, date |
| `between` | `[min, max]` — two-element array | number, date |
| `in` | `string[] \| number[]` | select |

---

## `PaginationState`

```ts
interface PaginationState {
  pageIndex: number   // 0-based
  pageSize:  number
}
```

---

## `GridRef<T>`

The interface exposed via `useRef<GridRef<T>>` + `forwardRef`.

```ts
interface GridRef<T> {
  getSelectedRows:  () => T[]
  getProcessedRows: () => T[]
  getGridState:     () => GridState
  clearSelection:   () => void
  exportCsv:        (opts?: { selectedOnly?: boolean }) => void
  setState:         (partial: Partial<GridState>) => void
}
```

---

## `DisplayRow<T>`

The discriminated union used internally for rendering. Group header rows are interspersed with data rows in the render loop.

```ts
type DisplayRow<T> = GroupHeaderRow | DataDisplayRow<T>

interface DataDisplayRow<T> {
  _type: 'data'
  row:   T
}

interface GroupHeaderRow {
  _type:      'group'
  id:         string                        // unique key: "columnId:value"
  columnId:   string
  value:      string | number | Date | null // the grouped value
  depth:      number                        // nesting level (0-based)
  childCount: number                        // rows in this group
  aggregates: Record<string, number | null> // columnId → aggregated value
  isExpanded: boolean
}
```

These types are not typically needed in consumer code unless you are building custom renderers or tests that inspect the display row structure.
