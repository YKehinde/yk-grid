---
title: Imperative ref API
render_with_liquid: false
---

# Imperative ref API

The `GridRef<T>` interface gives you programmatic access to the grid from outside the component — reading state, mutating state, clearing selection, and triggering export.

---

## Setup

```tsx
import { useRef } from 'react'
import { DataGrid, GridRef } from 'yk-grid'

interface User {
  id: string
  name: string
}

export default function UsersPage() {
  const ref = useRef<GridRef<User>>(null)

  return <DataGrid<User> ref={ref} ... />
}
```

The `forwardRef` pattern preserves the `T` generic, so `ref.current.getSelectedRows()` returns `User[]` rather than `unknown[]`.

---

## Methods

### `getSelectedRows(): T[]`

Returns the currently selected row objects.

```tsx
const selectedUsers = ref.current?.getSelectedRows() ?? []
```

### `getProcessedRows(): T[]`

Returns all rows after filtering, without pagination. In server mode this is just the current `data` array (the server has already filtered).

```tsx
// get everything that matches the current filters
const filtered = ref.current?.getProcessedRows() ?? []
```

### `getGridState(): GridState`

Returns the full current `GridState` snapshot — sorts, filters, grouping, pagination, selection, column sizing, and column visibility.

```tsx
const state = ref.current?.getGridState()
console.log(state?.sorts)
console.log(state?.filters)
console.log(Array.from(state?.selection ?? []))
```

### `clearSelection(): void`

Clears the selection set.

```tsx
await bulkDelete(ref.current?.getSelectedRows())
ref.current?.clearSelection()
```

### `exportCsv(opts?): void`

Triggers a CSV download.

```tsx
// Export all filtered rows
ref.current?.exportCsv()

// Export only selected rows
ref.current?.exportCsv({ selectedOnly: true })
```

### `setState(partial: Partial<GridState>): void`

Applies a partial state update. Currently supports `sorts`, `filters`, and `grouping`.

```tsx
// Set a sort
ref.current?.setState({
  sorts: [{ columnId: 'name', direction: 'asc' }],
})

// Clear all filters
ref.current?.setState({ filters: [] })

// Apply a filter
ref.current?.setState({
  filters: [
    { columnId: 'status', operator: 'eq', value: 'failed' },
    { columnId: 'amount', operator: 'gt', value: 100 },
  ],
})

// Set grouping
ref.current?.setState({ grouping: ['region'] })

// Clear grouping
ref.current?.setState({ grouping: [] })
```

---

## The `GridRef<T>` type

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

## Common patterns

### Sync grid state to URL

```tsx
const ref = useRef<GridRef<Order>>(null)
const [searchParams, setSearchParams] = useSearchParams()

function pushStateToUrl() {
  const state = ref.current?.getGridState()
  if (!state) return
  setSearchParams({
    sorts:   JSON.stringify(state.sorts),
    filters: JSON.stringify(state.filters),
  })
}
```

### Restore state from URL

```tsx
const [searchParams] = useSearchParams()

const initialState = useMemo(() => ({
  sorts:   JSON.parse(searchParams.get('sorts')   ?? '[]'),
  filters: JSON.parse(searchParams.get('filters') ?? '[]'),
}), [])

<DataGrid initialState={initialState} ... />
```

### Bulk-export button outside the grid

```tsx
<button onClick={() => ref.current?.exportCsv({ selectedOnly: true })}>
  Export selected
</button>

<DataGrid<Order> ref={ref} enableCsvExport={false} ... />
```

### Clear filters from a "Reset" button in the page header

```tsx
<button onClick={() => ref.current?.setState({ filters: [], sorts: [] })}>
  Reset view
</button>
```
