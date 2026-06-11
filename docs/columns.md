# Column definition

Every column is a `ColumnDef<T>` object. Only `id`, `header`, and `accessor` are required.

```ts
interface ColumnDef<T> {
  // --- required ---
  id: string
  header: string
  accessor: (row: T) => string | number | Date | null

  // --- rendering ---
  cell?: (value: unknown, row: T) => ReactNode
  exportValue?: (row: T) => string | number

  // --- features ---
  sortable?: boolean
  filterable?: boolean
  groupable?: boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'

  // --- filter type ---
  filterType?: 'text' | 'number' | 'select' | 'date'
  filterOptions?: string[]

  // --- sizing & visibility ---
  width?: number
  minWidth?: number
  resizable?: boolean
  hideable?: boolean
  defaultHidden?: boolean
}
```

---

## `id`

Unique string identifier for this column. Used as the key in sort/filter state, so once set it should not change across renders.

```ts
{ id: 'createdAt', ... }
```

---

## `header`

The text rendered in the column header cell.

---

## `accessor`

A function that extracts the cell value from a row object. The return type is `string | number | Date | null` — this is the value used for sorting, filtering, and (unless overridden) the default cell content.

```ts
accessor: r => r.price             // number
accessor: r => r.createdAt         // string ISO date or Date object
accessor: r => r.address?.city ?? null  // null if absent
```

---

## `cell` — custom cell renderer

Override how the cell value is displayed. Receives `(value, row)` where `value` is the result of `accessor` and `row` is the full row object.

```tsx
// Currency format
{
  id: 'amount',
  header: 'Amount',
  accessor: r => r.amount,
  cell: (_, row) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(row.amount),
}

// Status badge
{
  id: 'status',
  header: 'Status',
  accessor: r => r.status,
  cell: (_, row) => (
    <span className={`badge badge--${row.status}`}>{row.status}</span>
  ),
}

// Link
{
  id: 'name',
  header: 'Name',
  accessor: r => r.name,
  cell: (_, row) => <a href={`/users/${row.id}`}>{row.name}</a>,
}
```

> `cell` only affects display. Sorting and filtering still use the `accessor` value.

---

## `exportValue` — CSV export override

When `enableCsvExport` is set and a row is exported, this function provides the raw value written to the CSV cell. Useful when `cell` returns JSX that can't be serialised.

```ts
{
  id: 'price',
  header: 'Price',
  accessor: r => r.price,
  cell: (_, row) => <strong>{row.price.toFixed(2)}</strong>,
  exportValue: r => r.price.toFixed(2),  // plain text in the CSV
}
```

If omitted, the accessor value is used.

---

## `sortable`

Enables the sort chevron in the header. Click to sort ascending, click again for descending, click once more to clear. Shift-click to add to the multi-sort stack.

```ts
{ id: 'name', ..., sortable: true }
```

---

## `filterable`

Enables the filter icon in the header. Opens a filter panel for this column. The input type depends on `filterType` (defaults to text).

```ts
{ id: 'name', ..., filterable: true }
```

---

## `filterType`

Controls the UI and operators available in the filter panel.

| Value | UI | Operators |
|-------|----|-----------|
| `'text'` (default) | Single text input | `contains`, `eq` |
| `'number'` | Operator picker + number input | `eq`, `gt`, `gte`, `lt`, `lte`, `between` |
| `'select'` | Dropdown of distinct values | `eq` (single), `in` (multi) |
| `'date'` | Date input | `eq`, `gt`, `gte`, `lt`, `lte`, `between` |

```ts
{ id: 'age',    ..., filterType: 'number' }
{ id: 'status', ..., filterType: 'select' }
{ id: 'date',   ..., filterType: 'date'   }
```

For `'select'`, the options come from one of three places — see [Filtering — select options](./filtering.md#select-filter-options).

---

## `groupable`

Marks the column as available for grouping. When `enableColumnVisibility` is on, the column menu shows a "Group by" option.

```ts
{ id: 'region', ..., groupable: true }
```

See [Grouping](./grouping.md) for more.

---

## `aggregation`

When rows are grouped, display an aggregate of this column's values in the group header row.

```ts
{ id: 'amount', ..., aggregation: 'sum' }
{ id: 'margin', ..., aggregation: 'avg' }
{ id: 'items',  ..., aggregation: 'count' }
```

Supported functions: `'sum'`, `'avg'`, `'count'`, `'min'`, `'max'`.

`count` counts the number of rows in the group. All others operate on numeric values returned by `accessor`; non-numeric values are skipped.

---

## `filterOptions`

Static list of options for `filterType: 'select'`. When provided, these are used instead of auto-deriving from the data (client mode) or calling `fetchFilterOptions` (server mode).

```ts
{
  id: 'status',
  header: 'Status',
  accessor: r => r.status,
  filterType: 'select',
  filterOptions: ['active', 'inactive', 'pending'],
}
```

---

## `width`

Initial column width in pixels. Users can override it by dragging when `enableColumnResize` is set.

```ts
{ id: 'id', ..., width: 80 }
```

---

## `minWidth`

Minimum width in pixels when resizing. Prevents the column from being dragged below this width.

```ts
{ id: 'description', ..., minWidth: 200 }
```

---

## `resizable`

Opt a specific column in or out of resizing, regardless of the global `enableColumnResize` prop.

```ts
// enable resize grid-wide but lock one column
enableColumnResize
columns={[
  { id: 'actions', ..., resizable: false },
  // all others are resizable
]}
```

---

## `hideable`

Opt a specific column in or out of the column visibility picker, regardless of `enableColumnVisibility`.

```ts
// make the ID column non-hideable even though the feature is on
{ id: 'id', ..., hideable: false }
```

---

## `defaultHidden`

Start the column hidden. The user can reveal it via the column picker.

```ts
{ id: 'internalCode', ..., defaultHidden: true }
```

---

## Practical column array

A realistic example combining multiple options:

```tsx
const columns: ColumnDef<Transaction>[] = [
  {
    id: 'id',
    header: 'ID',
    accessor: r => r.id,
    width: 90,
    hideable: false,
  },
  {
    id: 'date',
    header: 'Date',
    accessor: r => r.date,
    sortable: true,
    filterable: true,
    filterType: 'date',
    width: 120,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: r => r.status,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: ['completed', 'failed', 'pending'],
    cell: (_, row) => <StatusBadge status={row.status} />,
    exportValue: r => r.status,
  },
  {
    id: 'amount',
    header: 'Amount',
    accessor: r => r.amount,
    sortable: true,
    filterable: true,
    filterType: 'number',
    aggregation: 'sum',
    cell: (_, row) => formatCurrency(row.amount),
    exportValue: r => r.amount,
    width: 120,
  },
  {
    id: 'notes',
    header: 'Notes',
    accessor: r => r.notes,
    filterable: true,
    defaultHidden: true,
    minWidth: 200,
  },
]
```
