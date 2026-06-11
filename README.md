# yk-grid

A production-ready React DataGrid component with built-in sorting, filtering, grouping, pagination, selection, column management, CSV export, virtual scrolling, inline cell editing, and optional AI-assisted natural-language query input.

Dual-format library (ESM + CJS) with full TypeScript generics. Zero runtime dependencies beyond React, Zod, and @tanstack/react-virtual.

---

## Features

- **Sorting** — multi-column, asc/desc, shift-click to stack
- **Filtering** — funnel icon per column; text, number (with operator picker), select (searchable checkboxes), and date filter types
- **Grouping** — nest rows by one or more columns with collapse/expand
- **Aggregations** — sum, avg, count, min, max per group
- **Pagination** — client-side or server-side, with configurable page sizes
- **Virtual scrolling** — renders only visible rows for large datasets (pass `height`)
- **Row selection** — single or multiple, with page or filtered-set select-all scope
- **Inline cell editing** — double-click any `editable` cell; Enter/Tab commits, Escape cancels
- **Column resizing** — drag column edges to resize
- **Column visibility** — show/hide columns via per-column menu
- **CSV export** — export visible or selected rows
- **Custom toolbar actions** — inject buttons or controls into the toolbar via a render prop
- **AI query input** — optional natural-language command bar backed by your own endpoint
- **Imperative ref API** — programmatically read state, clear selection, trigger export

---

## Install

```bash
npm install yk-grid
```

Peer dependencies:

```bash
npm install react react-dom zod
```

Import the library stylesheet once in your app entry point:

```tsx
import 'yk-grid/dist/yk-grid.css'
```

---

## Quick start

```tsx
import 'yk-grid/dist/yk-grid.css'
import { DataGrid } from 'yk-grid'
import type { ColumnDef } from 'yk-grid'

interface User {
  id: string
  name: string
  email: string
  age: number
  status: 'active' | 'inactive'
}

const columns: ColumnDef<User>[] = [
  { id: 'name',   header: 'Name',   accessor: r => r.name,   sortable: true, filterable: true },
  { id: 'email',  header: 'Email',  accessor: r => r.email,  sortable: true, filterable: true },
  { id: 'age',    header: 'Age',    accessor: r => r.age,    sortable: true, filterType: 'number', editable: true },
  { id: 'status', header: 'Status', accessor: r => r.status, sortable: true, filterType: 'select' },
]

export default function App() {
  return (
    <DataGrid<User>
      data={users}
      columns={columns}
      getRowId={r => r.id}
      dataMode="client"
      pageSize={50}
      height={600}
      selectionMode="multiple"
      enableColumnResize
      enableColumnVisibility
      onCellEdit={(value, row, col) => console.log(col.id, row.id, '→', value)}
    />
  )
}
```

---

## Column definition (`ColumnDef<T>`)

Every column is defined with a `ColumnDef<T>` object.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique column identifier |
| `header` | `string` | Column header label |
| `accessor` | `(row: T) => string \| number \| Date \| null` | Extracts the raw cell value from the row |
| `cell` | `(value, row: T) => ReactNode` | Optional custom cell renderer |
| `exportValue` | `(row: T) => string \| number` | Override the value used in CSV export |
| `sortable` | `boolean` | Enable sort on this column |
| `filterable` | `boolean` | Show the funnel filter button for this column |
| `filterType` | `'text' \| 'number' \| 'select' \| 'date'` | Filter panel variant. Defaults to `'text'` |
| `filterOptions` | `string[]` | Static options for `filterType: 'select'` |
| `groupable` | `boolean` | Allow this column to be used as a grouping key |
| `aggregation` | `'sum' \| 'avg' \| 'count' \| 'min' \| 'max'` | Aggregation shown in group header rows |
| `editable` | `boolean` | Double-click to edit the cell inline |
| `width` | `number` | Default column width in pixels |
| `minWidth` | `number` | Minimum width when resizing (default: 50) |
| `resizable` | `boolean` | Override per-column resize (default: inherits `enableColumnResize`) |
| `hideable` | `boolean` | Whether this column can be hidden in the visibility picker |
| `defaultHidden` | `boolean` | Start the column hidden |

---

## Props

### Required

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Row data |
| `columns` | `ColumnDef<T>[]` | Column definitions |
| `getRowId` | `(row: T) => string` | Unique row identifier function |

### Data & loading

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataMode` | `'client' \| 'server'` | `'server'` | `client` handles sort/filter/page locally; `server` fires `onStateChange` for you to fetch |
| `pageSize` | `number` | `20` | Initial rows per page |
| `rowCount` | `number` | — | Total row count for server-side pagination |
| `loading` | `boolean` | `false` | Shows a loading overlay |
| `onStateChange` | `(state: GridState) => void` | — | Fires when sorts, filters, grouping, or pagination change |
| `initialState` | `Partial<GridState>` | — | Seed initial sorts, filters, grouping, pagination, etc. |

### Selection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Row selection behaviour |
| `selectAllScope` | `'page' \| 'filtered'` | `'page'` | What the select-all checkbox targets |
| `onSelectionChange` | `(rows: T[], ids: string[]) => void` | — | Fires whenever the selection changes |

### Click handlers

| Prop | Type | Description |
|------|------|-------------|
| `onRowClick` | `(row: T, index: number, e: MouseEvent) => void` | Called when a data row is clicked |
| `onCellClick` | `(value, row: T, column: ColumnDef<T>, e: MouseEvent) => void` | Called when an individual cell is clicked |

### Column features

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableColumnResize` | `boolean` | `false` | Drag-to-resize column widths |
| `enableColumnVisibility` | `boolean` | `false` | Show/hide column picker in header menus |

### Filtering

| Prop | Type | Description |
|------|------|-------------|
| `fetchFilterOptions` | `(columnId: string) => Promise<string[]>` | Server mode: fetch options for `filterType: 'select'` columns |

### Virtual scrolling

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number \| string` | — | Fixed height activates virtual scrolling (e.g. `600` or `'80vh'`) |
| `estimatedRowHeight` | `number` | `41` | Row height hint for the virtualiser; affects scroll accuracy |

### Inline editing

| Prop | Type | Description |
|------|------|-------------|
| `onCellEdit` | `(newValue: string \| number, row: T, column: ColumnDef<T>) => void` | Called when a cell edit is committed. Set `editable: true` on columns you want editable. |

### Export

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableCsvExport` | `boolean` | `false` | Adds CSV export button to toolbar |
| `csvFilename` | `string` | `'export.csv'` | Downloaded file name |

### Toolbar

| Prop | Type | Description |
|------|------|-------------|
| `toolbarActions` | `(ctx: ToolbarCtx<T>) => ReactNode` | Render prop injected into the toolbar |

`ToolbarCtx<T>` contains: `selectedRows`, `selectedIds`, `processedRows`, `gridState`, `clearSelection`.

### AI

| Prop | Type | Description |
|------|------|-------------|
| `ai` | `{ endpoint: string; placeholder?: string }` | Enables the natural-language command bar |

### Display

| Prop | Type | Description |
|------|------|-------------|
| `emptyState` | `ReactNode` | Custom content when there are no rows |
| `className` | `string` | Class applied to the root wrapper element |

---

## Imperative ref (`GridRef<T>`)

Pass a `ref` to read state and trigger actions programmatically:

```tsx
import { useRef } from 'react'
import { DataGrid, GridRef } from 'yk-grid'

const gridRef = useRef<GridRef<User>>(null)

<DataGrid ref={gridRef} ... />
```

| Method | Returns | Description |
|--------|---------|-------------|
| `getSelectedRows()` | `T[]` | Currently selected row objects |
| `getProcessedRows()` | `T[]` | All rows after filtering (ignores pagination) |
| `getGridState()` | `GridState` | Full current grid state snapshot |
| `clearSelection()` | `void` | Clear all selected rows |
| `exportCsv(opts?)` | `void` | Trigger CSV download. `opts.selectedOnly` exports selection only |
| `setState(partial)` | `void` | Programmatically set sorts, filters, or grouping |

---

## Theming

All visual properties are controlled via CSS custom properties on `:root` (or any ancestor element):

| Variable | Default | Description |
|----------|---------|-------------|
| `--grid-font-size` | `0.875rem` | Base font size |
| `--grid-border-colour` | `#e2e8f0` | Cell/row border colour |
| `--grid-header-bg` | `#f1f5f9` | Header and toolbar background |
| `--grid-row-hover-bg` | `#f8fafc` | Row hover background |
| `--grid-selected-bg` | `#eef2ff` | Selected row background |
| `--grid-accent` | `#6366f1` | Accent colour (focus rings, active filters, sort indicators) |
| `--grid-focus-ring` | `0 0 0 2px #6366f1` | Focus ring box-shadow |
| `--grid-radius` | `0.5rem` | Border radius of the outer wrapper |
| `--grid-cell-padding` | `0.625rem 0.875rem` | Cell padding (shorthand) |
| `--grid-cell-padding-y` | `0.625rem` | Vertical cell padding |
| `--grid-cell-padding-x` | `0.875rem` | Horizontal cell padding |
| `--grid-toolbar-gap` | `0.5rem` | Toolbar item gap |

Example — dark theme:

```css
.my-dark-wrapper {
  --grid-border-colour: #334155;
  --grid-header-bg: #1e293b;
  --grid-row-hover-bg: #1e293b;
  --grid-selected-bg: #312e81;
  --grid-accent: #818cf8;
}
```

---

## Server mode

In `dataMode="server"`, the grid fires `onStateChange` whenever the user sorts, filters, groups, or paginates. Use this to fetch from your API:

```tsx
const [data, setData] = useState<User[]>([])
const [rowCount, setRowCount] = useState(0)
const [loading, setLoading] = useState(false)

async function fetchData(state: GridState) {
  setLoading(true)
  const res = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(state),
  })
  const json = await res.json()
  setData(json.rows)
  setRowCount(json.total)
  setLoading(false)
}

<DataGrid<User>
  dataMode="server"
  data={data}
  columns={columns}
  getRowId={r => r.id}
  rowCount={rowCount}
  loading={loading}
  onStateChange={fetchData}
/>
```

---

## AI integration

The AI bar accepts natural-language queries and translates them into grid actions (sort, filter, group) via your endpoint.

```tsx
<DataGrid
  ai={{
    endpoint: '/api/grid-ai',
    placeholder: 'e.g. "show failed refunds over £200, sorted by amount"',
  }}
  ...
/>
```

Wire up the server handler (Express or Next.js App Router):

```ts
// Express
import { gridAiRoute } from 'yk-grid/server'
app.post('/api/grid-ai', gridAiRoute({ provider: 'anthropic' }))

// Next.js App Router
import { gridAiRoute } from 'yk-grid/server'
export const POST = gridAiRoute({ provider: 'anthropic' })
```

Set `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) in your environment. See `server/gridAiRoute.ts` for the full provider options.

---

## Development

```bash
npm run dev:example    # Vite dev server at localhost:5173 (example app + AI middleware)
npm test               # vitest single pass
npm run test:watch     # vitest watch
npm run typecheck      # tsc --noEmit
npm run build          # typecheck + vite build → dist/
npx playwright test    # E2E smoke tests (requires: npx playwright install chromium)
```

Set `ANTHROPIC_API_KEY` in `example/.env.local` to use the AI bar during development.

---

## Licence

MIT
