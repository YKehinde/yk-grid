---
title: Filtering
---

# Filtering

## Enabling filters

Set `filterable: true` on any column definition. The filter icon appears in the column header and opens a filter panel when clicked.

```ts
const columns: ColumnDef<Product>[] = [
  { id: 'name',     header: 'Name',     accessor: r => r.name,     filterable: true },
  { id: 'category', header: 'Category', accessor: r => r.category, filterable: true, filterType: 'select' },
  { id: 'price',    header: 'Price',    accessor: r => r.price,    filterable: true, filterType: 'number' },
  { id: 'added',    header: 'Added',    accessor: r => r.added,    filterable: true, filterType: 'date' },
]
```

---

## Filter types

### `text` (default)

A single text input. Supports two operators selected from a mini picker:

| Operator | Behaviour |
|----------|-----------|
| `contains` | Case-insensitive substring match |
| `eq` | Case-insensitive exact match |

```ts
{ id: 'description', ..., filterable: true }
// filterType defaults to 'text'
```

---

### `number`

A number input with an operator picker. The `between` operator shows two inputs (min and max).

| Symbol | Operator | Description |
|--------|----------|-------------|
| `=` | `eq` | Exactly equal |
| `>` | `gt` | Greater than |
| `≥` | `gte` | Greater than or equal |
| `<` | `lt` | Less than |
| `≤` | `lte` | Less than or equal |
| `↔` | `between` | Between two values (inclusive) |

```ts
{ id: 'price', ..., filterType: 'number' }
```

---

### `select`

A dropdown of distinct values. Multiple values can be selected (uses the `in` operator internally). See [Select filter options](#select-filter-options) below.

```ts
{ id: 'status', ..., filterType: 'select' }
```

---

### `date`

A date input. Supports the same operators as `number` (eq, gt, gte, lt, lte, between). The `between` operator shows start and end date inputs.

Dates are compared by timestamp. `accessor` can return a `Date` object, an ISO date string, or a numeric timestamp — they are all handled correctly.

```ts
{ id: 'createdAt', ..., filterType: 'date' }
```

---

## Select filter options

For `filterType: 'select'` columns, option values come from one of three sources, checked in this order:

### 1. Static `filterOptions` on the column

Use when the valid values are known ahead of time or must appear in a specific order.

```ts
{
  id: 'status',
  header: 'Status',
  accessor: r => r.status,
  filterType: 'select',
  filterOptions: ['active', 'inactive', 'pending'],
}
```

### 2. Auto-derived from data (client mode)

In `dataMode="client"`, any `select` column without `filterOptions` automatically computes its dropdown from the unique values in `data`. No configuration needed.

```ts
// client mode — 'country' will auto-populate from the data
{ id: 'country', header: 'Country', accessor: r => r.country, filterType: 'select' }
```

### 3. `fetchFilterOptions` (server mode)

In `dataMode="server"` you don't have the full dataset locally. Pass `fetchFilterOptions` to the grid — it calls the function once per `select` column on mount and caches the results.

```tsx
<DataGrid
  dataMode="server"
  fetchFilterOptions={async (columnId) => {
    const res = await fetch(`/api/filter-options?column=${columnId}`)
    return res.json()  // string[]
  }}
  ...
/>
```

To force a re-fetch after the underlying data changes, change the function reference — typically by incrementing a version counter in `useCallback`'s dependency array:

```tsx
const [optionsVersion, setOptionsVersion] = useState(0)

const fetchFilterOptions = useCallback(async (columnId: string) => {
  const res = await fetch(`/api/filter-options?column=${columnId}&v=${optionsVersion}`)
  return res.json()
}, [optionsVersion])

// later, to refresh:
setOptionsVersion(v => v + 1)
```

---

## Default filters on mount

Use `initialState.filters` to open the grid with filters already active:

```tsx
<DataGrid
  initialState={{
    filters: [
      { columnId: 'status', operator: 'eq', value: 'active' },
      { columnId: 'price',  operator: 'gt', value: 100 },
    ],
  }}
  ...
/>
```

---

## Programmatic filtering

Set or clear filters from outside the grid using the [imperative ref API](./imperative-ref.md):

```tsx
const ref = useRef<GridRef<Product>>(null)

// Set a filter
ref.current?.setState({
  filters: [{ columnId: 'status', operator: 'eq', value: 'failed' }],
})

// Clear all filters
ref.current?.setState({ filters: [] })
```

---

## Multiple active filters

All active filters are AND-combined: a row must satisfy every filter to appear.

---

## The `FilterEntry` type

```ts
interface FilterEntry {
  columnId: string
  operator: 'eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in'
  value: string | number | Array<string | number>
}
```

Operator constraints by filter type:

| `filterType` | Allowed operators |
|--------------|-------------------|
| `text` | `contains`, `eq` |
| `number` | `eq`, `gt`, `gte`, `lt`, `lte`, `between` |
| `select` | `eq`, `in` |
| `date` | `eq`, `gt`, `gte`, `lt`, `lte`, `between` |

`between` requires `value` to be a two-element array: `[min, max]`.  
`in` requires `value` to be an array of strings or numbers.

---

## Server mode

In `dataMode="server"` the grid does not filter rows itself. It includes the active `filters` in the `GridState` passed to `onStateChange`. Filtering resets the page index to 0 automatically.

See [Server mode](./server-mode.md) for the full pattern.
