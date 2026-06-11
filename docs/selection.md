# Selection

## Enabling selection

Set `selectionMode` to `'single'` or `'multiple'`. Defaults to `'none'` (no selection UI).

```tsx
// Single selection — only one row at a time
<DataGrid selectionMode="single" ... />

// Multiple selection — checkboxes on every row
<DataGrid selectionMode="multiple" ... />
```

---

## Reacting to selection changes

`onSelectionChange` fires whenever the selection set changes. It receives both the full row objects and the string IDs.

```tsx
<DataGrid
  selectionMode="multiple"
  onSelectionChange={(rows, ids) => {
    console.log('Selected:', rows)
    console.log('IDs:', ids)
  }}
  ...
/>
```

---

## Select-all scope

The select-all checkbox in the header can target either the current page or all filtered rows:

```tsx
// Default: only rows on the current page
<DataGrid selectionMode="multiple" selectAllScope="page" ... />

// Select across the full filtered set (not just the visible page)
<DataGrid selectionMode="multiple" selectAllScope="filtered" ... />
```

Use `'filtered'` when you need bulk actions that span pages (e.g. "delete all matching rows").

---

## Reading selection imperatively

Use the [ref API](./imperative-ref.md) to read or clear selection from outside the component:

```tsx
const ref = useRef<GridRef<User>>(null)

// Get selected rows
const rows = ref.current?.getSelectedRows()  // User[]
const state = ref.current?.getGridState()
const ids = Array.from(state.selection)      // string[]

// Clear selection
ref.current?.clearSelection()
```

---

## Toolbar integration

The `toolbarActions` render prop exposes `selectedRows` and `clearSelection`, which makes it straightforward to build bulk-action toolbars:

```tsx
<DataGrid
  selectionMode="multiple"
  toolbarActions={({ selectedRows, clearSelection }) => (
    <>
      <span>{selectedRows.length} selected</span>
      <button
        disabled={selectedRows.length === 0}
        onClick={async () => {
          await bulkArchive(selectedRows.map(r => r.id))
          clearSelection()
        }}
      >
        Archive selected
      </button>
      <button
        disabled={selectedRows.length === 0}
        onClick={() => clearSelection()}
      >
        Clear selection
      </button>
    </>
  )}
  ...
/>
```

See [Toolbar](./toolbar.md) for the full `toolbarActions` context shape.

---

## Pre-selecting rows on mount

Use `initialState.selection` to start with rows already selected. `selection` is a `Set<string>` of row IDs.

```tsx
<DataGrid
  selectionMode="multiple"
  initialState={{
    selection: new Set(['row-1', 'row-5', 'row-12']),
  }}
  ...
/>
```

---

## Row click vs selection

Row selection (via checkbox) is independent of `onRowClick`. You can use both together:

```tsx
<DataGrid
  selectionMode="multiple"
  onSelectionChange={(rows) => setSelected(rows)}
  onRowClick={(row) => navigate(`/products/${row.id}`)}
  ...
/>
```

Clicking the checkbox selects the row. Clicking the rest of the row fires `onRowClick`.
