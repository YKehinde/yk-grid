---
title: Sorting
---

# Sorting

## Enabling sort on a column

Add `sortable: true` to any column definition:

```ts
const columns: ColumnDef<User>[] = [
  { id: 'name',  header: 'Name',  accessor: r => r.name,  sortable: true },
  { id: 'email', header: 'Email', accessor: r => r.email, sortable: true },
  { id: 'age',   header: 'Age',   accessor: r => r.age,   sortable: true },
]
```

Clicking a sortable header cycles through: none → ascending → descending → none.

---

## Multi-column sort

Hold **Shift** and click a second (or third) header to add it to the sort stack. The column shows its position number in the header when multiple sorts are active.

Sort priority follows click order: the first sorted column has the highest priority.

---

## Default sort on mount

Use `initialState.sorts` to pre-set sorts when the grid first renders:

```tsx
<DataGrid
  initialState={{
    sorts: [
      { columnId: 'name', direction: 'asc' },
    ],
  }}
  ...
/>
```

Multi-column pre-sort:

```tsx
initialState={{
  sorts: [
    { columnId: 'category', direction: 'asc' },
    { columnId: 'price',    direction: 'desc' },
  ],
}}
```

---

## Programmatic sort

Use the [imperative ref API](./imperative-ref.md) to set or clear sorts from outside the grid:

```tsx
const ref = useRef<GridRef<User>>(null)

// Replace all sorts
ref.current?.setState({
  sorts: [{ columnId: 'name', direction: 'asc' }],
})

// Clear all sorts
ref.current?.setState({ sorts: [] })
```

---

## Sort behaviour

- **Nulls last** — rows with a `null` accessor value sort to the bottom regardless of direction.
- **Numbers** — compared numerically.
- **Strings** — compared with `localeCompare` (numeric: true, case-insensitive).
- **Dates** — compared by timestamp. Accepts `Date` objects, ISO strings, or numeric timestamps.

---

## Server mode

In `dataMode="server"` the grid does not sort rows itself. It includes the current `sorts` in the `GridState` passed to `onStateChange`, and it's your responsibility to apply the sorts server-side.

```tsx
async function handleStateChange(state: GridState) {
  // state.sorts: Array<{ columnId: string; direction: 'asc' | 'desc' }>
  const res = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ sorts: state.sorts, ... }),
  })
  const { rows } = await res.json()
  setData(rows)
}
```

See [Server mode](./server-mode.md) for the full pattern.

---

## The `SortEntry` type

```ts
interface SortEntry {
  columnId: string
  direction: 'asc' | 'desc'
}
```
