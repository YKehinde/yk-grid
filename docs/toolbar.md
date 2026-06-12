---
title: Toolbar
---

# Toolbar & custom actions

## The toolbar

The toolbar sits between the AI bar (if enabled) and the table header. It always shows a selection count when rows are selected. Additional controls appear based on props.

---

## CSV export button

Set `enableCsvExport` to add a download button to the toolbar. The default filename is `export.csv`.

```tsx
<DataGrid
  enableCsvExport
  csvFilename="orders-2024.csv"
  ...
/>
```

The export button exports all filtered rows (not paginated — all matching rows). In server mode it exports the rows currently in `data` (the current page).

To export programmatically or to export only selected rows, use the [imperative ref API](./imperative-ref.md):

```tsx
ref.current?.exportCsv()                       // all filtered rows
ref.current?.exportCsv({ selectedOnly: true }) // selected rows only
```

---

## Custom toolbar actions — `toolbarActions`

A render prop that injects your own buttons or content into the toolbar. Use it for bulk actions, custom export triggers, status messages — anything that belongs alongside the selection count.

```tsx
<DataGrid
  selectionMode="multiple"
  toolbarActions={({ selectedRows, selectedIds, clearSelection }) => (
    <>
      <button
        disabled={selectedRows.length === 0}
        onClick={async () => {
          await bulkApprove(selectedIds)
          clearSelection()
        }}
      >
        Approve ({selectedRows.length})
      </button>
      <button
        disabled={selectedRows.length === 0}
        onClick={async () => {
          await bulkReject(selectedIds)
          clearSelection()
        }}
      >
        Reject ({selectedRows.length})
      </button>
    </>
  )}
  ...
/>
```

---

## The `toolbarActions` context

The render prop receives a context object:

```ts
{
  selectedRows:   T[]           // full row objects currently selected
  selectedIds:    string[]      // IDs of selected rows
  processedRows:  T[]           // all rows after filtering (no pagination)
  gridState:      GridState     // full current grid state
  clearSelection: () => void    // clears the selection set
}
```

`processedRows` is useful when you want to act on the full filtered result set, not just the current page — for example, a "Download all matching" button:

```tsx
toolbarActions={({ processedRows, selectedRows, selectedIds }) => (
  <>
    <button onClick={() => exportToExcel(processedRows)}>
      Download all ({processedRows.length})
    </button>
    {selectedIds.length > 0 && (
      <button onClick={() => exportToExcel(selectedRows)}>
        Download selected ({selectedIds.length})
      </button>
    )}
  </>
)}
```

---

## Combining `toolbarActions` with `enableCsvExport`

Both can be used together. The CSV export button appears on the right side of the toolbar; `toolbarActions` content appears to the left of it.

```tsx
<DataGrid
  enableCsvExport
  selectionMode="multiple"
  toolbarActions={({ selectedRows, clearSelection }) => (
    <button onClick={() => bulkDelete(selectedRows).then(clearSelection)}>
      Delete ({selectedRows.length})
    </button>
  )}
  ...
/>
```

---

## CSV export format

The built-in CSV export follows RFC 4180:

- First row is the header (column `header` values)
- Values are comma-separated; strings containing commas or double-quotes are wrapped in double-quotes
- Internal double-quotes are escaped as `""`
- Line endings are `\r\n`

If a column has `exportValue` defined, that value is used. Otherwise `accessor` is used. Columns that are currently hidden are excluded from the export.
