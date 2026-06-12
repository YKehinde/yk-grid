---
title: Getting started
---

# Getting started

## Requirements

- React 18 or 19
- TypeScript 5+ (strongly recommended; the library ships with full `.d.ts` declarations)
- zod 4+ (peer dependency — used internally for AI command validation)

## Install

```bash
npm install yk-grid
# peer deps
npm install react react-dom zod
```

## Minimal example — client mode

The fastest way to get started: pass your data, define columns, and set `dataMode="client"`. The grid handles sorting, filtering, and pagination without any server calls.

```tsx
import { DataGrid } from 'yk-grid'
import type { ColumnDef } from 'yk-grid'

interface Product {
  id: string
  name: string
  category: string
  price: number
  inStock: boolean
}

const columns: ColumnDef<Product>[] = [
  {
    id: 'name',
    header: 'Product',
    accessor: r => r.name,
    sortable: true,
    filterable: true,
  },
  {
    id: 'category',
    header: 'Category',
    accessor: r => r.category,
    sortable: true,
    filterType: 'select',
  },
  {
    id: 'price',
    header: 'Price',
    accessor: r => r.price,
    sortable: true,
    filterType: 'number',
    cell: (_, row) => `£${row.price.toFixed(2)}`,
  },
]

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <DataGrid<Product>
      data={products}
      columns={columns}
      getRowId={r => r.id}
      dataMode="client"
      pageSize={25}
    />
  )
}
```

## Adding common features

Start minimal and layer features in as you need them:

```tsx
<DataGrid<Product>
  data={products}
  columns={columns}
  getRowId={r => r.id}
  dataMode="client"
  pageSize={25}

  // column features
  enableColumnResize
  enableColumnVisibility

  // selection
  selectionMode="multiple"
  onSelectionChange={(rows) => console.log(rows)}

  // export
  enableCsvExport
  csvFilename="products.csv"

  // virtual scrolling for large lists
  height={600}
/>
```

## TypeScript generics

`DataGrid` is fully generic over your row type `T`. Pass it explicitly when TypeScript can't infer it (which it usually can't from JSX):

```tsx
<DataGrid<Product> ... />
```

The generic flows through to `ColumnDef<T>`, `GridRef<T>`, and every callback:

```tsx
const columns: ColumnDef<Product>[] = [...]
const ref = useRef<GridRef<Product>>(null)

onSelectionChange={(rows: Product[], ids: string[]) => ...}
onRowClick={(row: Product) => ...}
```

## Pre-setting initial state

Use `initialState` to open the grid with specific sorts, filters, or grouping already applied:

```tsx
<DataGrid<Product>
  initialState={{
    sorts: [{ columnId: 'price', direction: 'desc' }],
    filters: [{ columnId: 'category', operator: 'eq', value: 'electronics' }],
  }}
  ...
/>
```

`initialState` is only read once on mount. To change state after mount, use the [imperative ref API](./imperative-ref.md).

## Empty state

Render custom content when the grid has nothing to show (empty data or all rows filtered out):

```tsx
<DataGrid
  emptyState={
    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
      <p>No products match your filters.</p>
      <button onClick={clearFilters}>Clear filters</button>
    </div>
  }
  ...
/>
```

## Styling the wrapper

Pass a `className` to the root element to integrate with your layout or apply border/shadow:

```tsx
<DataGrid className="my-grid" ... />
```

```css
.my-grid {
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}
```

For deeper theming (colours, font size, accent), see [Theming](./theming.md).

## Next steps

- Define advanced column options → [Column definition](./columns.md)
- Set up server-driven data → [Server mode](./server-mode.md)
- Add the AI command bar → [AI integration](./ai-integration.md)
- Handle large datasets → [Virtual scrolling](./virtual-scrolling.md)

