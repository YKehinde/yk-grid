---
title: Pagination
---

# Pagination

## Client-side pagination

Set `dataMode="client"` (or omit it — it defaults to `'server'`, so be explicit). Pass all rows in `data`; the grid slices them per page automatically.

```tsx
<DataGrid<Product>
  data={products}     // all rows — the grid paginates them
  columns={columns}
  getRowId={r => r.id}
  dataMode="client"
  pageSize={25}
/>
```

The user can also change the page size from the pagination control below the table.

---

## Server-side pagination

Set `dataMode="server"` and supply only the current page of rows in `data`. Pass the total row count in `rowCount` so the grid can calculate page numbers.

```tsx
const [data, setData]         = useState<Product[]>([])
const [rowCount, setRowCount] = useState(0)

async function handleStateChange(state: GridState) {
  const res = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify({
      page:     state.pagination.pageIndex,
      pageSize: state.pagination.pageSize,
      sorts:    state.sorts,
      filters:  state.filters,
    }),
  })
  const { rows, total } = await res.json()
  setData(rows)
  setRowCount(total)
}

<DataGrid<Product>
  data={data}
  rowCount={rowCount}
  columns={columns}
  getRowId={r => r.id}
  dataMode="server"
  pageSize={25}
  onStateChange={handleStateChange}
/>
```

`onStateChange` fires whenever pagination, sorts, filters, or grouping change. It does not fire for selection, column sizing, or column visibility.

---

## Initial page

Pre-set the page index with `initialState`:

```tsx
<DataGrid
  initialState={{
    pagination: { pageIndex: 2, pageSize: 50 },
  }}
  ...
/>
```

---

## Automatic page reset

Several state changes automatically reset the page back to 0:

- A filter is applied or removed
- Grouping changes
- Page size changes

Sorting does **not** reset the page — users can sort within a page in client mode.

---

## The `PaginationState` type

```ts
interface PaginationState {
  pageIndex: number   // 0-based
  pageSize: number
}
```

In `GridState`:

```ts
interface GridState {
  pagination: PaginationState
  ...
}
```

---

## Loading state

Show a spinner over the grid while a server fetch is in-flight:

```tsx
const [loading, setLoading] = useState(false)

async function handleStateChange(state: GridState) {
  setLoading(true)
  try {
    const res = await fetch(...)
    ...
  } finally {
    setLoading(false)
  }
}

<DataGrid loading={loading} ... />
```

