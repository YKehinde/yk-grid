---
title: Grouping
---

# Grouping & aggregations

## Enabling grouping on a column

Mark a column as `groupable: true`:

```ts
const columns: ColumnDef<Sale>[] = [
  { id: 'region',   header: 'Region',   accessor: r => r.region,   groupable: true },
  { id: 'category', header: 'Category', accessor: r => r.category, groupable: true },
  { id: 'amount',   header: 'Amount',   accessor: r => r.amount,   aggregation: 'sum' },
]
```

When `enableColumnVisibility` is also set, a "Group by" action appears in the column menu. Alternatively set grouping via `initialState` or the imperative ref API.

---

## Default grouping on mount

Use `initialState.grouping` to open the grid already grouped:

```tsx
<DataGrid
  initialState={{
    grouping: ['region'],
  }}
  ...
/>
```

Multi-level grouping (outer → inner):

```tsx
initialState={{
  grouping: ['region', 'category'],
}}
```

---

## Programmatic grouping

Set grouping from outside the grid:

```tsx
const ref = useRef<GridRef<Sale>>(null)

// Group by region
ref.current?.setState({ grouping: ['region'] })

// Clear grouping
ref.current?.setState({ grouping: [] })
```

---

## Expand / collapse groups

Group header rows have a toggle button. Clicking expands or collapses that group's child rows. Collapsed groups still show aggregated values.

Groups are collapsed by default. To open specific groups on mount, populate `initialState.expanded` with the group IDs. Group IDs follow the pattern `columnId:value` (or `parentId|columnId:value` for nested groups):

```tsx
initialState={{
  grouping: ['region'],
  expanded: new Set(['region:Europe', 'region:Asia']),
}}
```

---

## Aggregations

When rows are grouped, columns with an `aggregation` value display a summary in each group header row.

```ts
{ id: 'revenue',  ..., aggregation: 'sum' }
{ id: 'margin',   ..., aggregation: 'avg' }
{ id: 'refunds',  ..., aggregation: 'count' }
{ id: 'minPrice', ..., aggregation: 'min' }
{ id: 'maxPrice', ..., aggregation: 'max' }
```

Supported aggregation functions:

| Function | Description |
|----------|-------------|
| `sum` | Total of all numeric values |
| `avg` | Mean of all numeric values |
| `count` | Number of rows in the group |
| `min` | Smallest numeric value |
| `max` | Largest numeric value |

`count` uses the row count directly. All others skip non-numeric accessor values.

---

## Multi-level grouping

Multiple column IDs in `grouping` create nested groups. The first entry is the outermost level.

```tsx
initialState={{
  grouping: ['region', 'category'],
}}
```

Results in:

```
▶ Europe (12 rows)
  ▶ Electronics (5 rows)
  ▶ Clothing (7 rows)
▶ Asia (8 rows)
  ...
```

---

## Sorting with grouping

Sort behaviour with active grouping:

- A sort on a **grouping column** orders the groups themselves.
- A sort on a **non-grouping column** orders the rows within each group.

---

## Grouping in server mode

In `dataMode="server"` the grid passes `grouping: string[]` in `GridState` to `onStateChange`. Group header rows and expand/collapse state are still managed client-side — the server only needs to return the raw rows for the current page; the grid builds the group hierarchy.

If you prefer fully server-side grouping (pre-grouped responses), do not use the `grouping` state — render custom group rows using the `cell` renderer on a dedicated column instead.

