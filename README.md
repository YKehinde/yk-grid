# yk-grid

A production-ready React DataGrid component with built-in sorting, filtering, grouping, pagination, selection, column management, CSV export, and optional AI-assisted query input.

Distributed as a dual-format library (ESM + CJS) with full TypeScript types. Zero runtime dependencies beyond React and Zod.

---

## Features

- **Sorting** — multi-column, asc/desc, shift-click to stack
- **Filtering** — text, number (with operator picker), select, and date filter types
- **Grouping** — nest rows by one or more columns with collapse/expand
- **Aggregations** — sum, avg, count, min, max per group
- **Pagination** — client-side or server-side
- **Row selection** — single or multiple, with page or filtered-set select-all scope
- **Column resizing** — drag column edges to resize
- **Column visibility** — show/hide columns via toolbar toggle
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

---

## Quick start

```tsx
import { DataGrid } from 'yk-grid'
import type { ColumnDef } from 'yk-grid'

interface User {
  id: string
  name: string
  email: string
  age: number
}

const columns: ColumnDef<User>[] = [
  { id: 'name',  header: 'Name',  accessor: r => r.name,  sortable: true, filterable: true },
  { id: 'email', header: 'Email', accessor: r => r.email, sortable: true, filterable: true },
  { id: 'age',   header: 'Age',   accessor: r => r.age,   sortable: true, filterType: 'number' },
]

export default function App() {
  return (
    <DataGrid<User>
      data={users}
      columns={columns}
      getRowId={r => r.id}
      dataMode="client"
      pageSize={20}
    />
  )
}
```

---

## Props

### Required

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Row data |
| `columns` | `ColumnDef<T>[]` | Column definitions |
| `getRowId` | `(row: T) => string` | Unique row identifier |

### Data & loading

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataMode` | `'client' \| 'server'` | `'server'` | Client handles sort/filter/page locally; server mode passes state via `onStateChange` |
| `pageSize` | `number` | `20` | Rows per page |
| `rowCount` | `number` | — | Total row count for server-side pagination |
| `loading` | `boolean` | `false` | Shows a loading overlay |
| `onStateChange` | `(state: GridState) => void` | — | Fires when sorts, filters, grouping, or pagination change — use to drive server-side fetches |

### Selection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Row selection behaviour |
| `selectAllScope` | `'page' \| 'filtered'` | `'page'` | What the select-all checkbox targets |
| `onSelectionChange` | `(rows: T[], ids: string[]) => void` | — | Fires when selection changes |

### Click handlers

| Prop | Type | Description |
|------|------|-------------|
| `onRowClick` | `(row: T, index: number, e: MouseEvent) => void` | Row click |
| `onCellClick` | `(value, row, column, e) => void` | Cell click |

### Column features

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableColumnResize` | `boolean` | `false` | Drag-to-resize column widths |
| `enableColumnVisibility` | `boolean` | `false` | Show/hide column picker in header |

### Filtering

| Prop | Type | Description |
|------|------|-------------|
| `fetchFilterOptions` | `(columnId: string) => Promise<string[]>` | For server mode: called once per `select`-type column to populate its dropdown. In client mode, unique values are derived from `data` automatically — this prop is not needed. |

### Export

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableCsvExport` | `boolean` | `false` | Adds CSV export button to toolbar |
| `csvFilename` | `string` | `'export.csv'` | Downloaded file name |

### Toolbar

| Prop | Type | Description |
|------|------|-------------|
| `toolbarActions` | `(ctx) => ReactNode` | Render prop injected into the toolbar. `ctx` exposes `selectedRows`, `selectedIds`, `processedRows`, `gridState`, and `clearSelection` |

### AI

| Prop | Type | Description |
|------|------|-------------|
| `ai` | `{ endpoint: string; placeholder?: string }` | Enables the natural-language command bar. Sends prompts to your own server endpoint — see [AI integration](#ai-integration) |

### Other

| Prop | Type | Description |
|------|------|-------------|
| `initialState` | `Partial<GridState>` | Seed the grid with pre-set sorts, filters, grouping, etc. |
| `emptyState` | `ReactNode` | Custom content when there are no rows to display |
| `className` | `string` | Class applied to the root wrapper element |

---

## Column definition

```ts
interface ColumnDef<T> {
  id: string
  header: string
  accessor: (row: T) => string | number | Date | null

  // rendering
  cell?: (value: unknown, row: T) => ReactNode   // custom cell renderer
  exportValue?: (row: T) => string | number      // value used when exporting to CSV

  // features
  sortable?: boolean
  filterable?: boolean
  groupable?: boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'

  // filter type
  filterType?: 'text' | 'number' | 'select' | 'date'
  filterOptions?: string[]  // static options for filterType='select' (optional — see below)

  // sizing & visibility
  width?: number
  minWidth?: number
  resizable?: boolean        // defaults to true when enableColumnResize is set
  hideable?: boolean         // defaults to true when enableColumnVisibility is set
  defaultHidden?: boolean    // start hidden; user can reveal via column picker
}
```

---

## Select filter options

For `filterType: 'select'` columns, there are three ways to supply the dropdown options:

**1. Client mode — auto-derived (no config needed)**

In `dataMode="client"`, the grid scans the data and computes unique values automatically. You don't need `filterOptions` at all.

```tsx
// Country and region populate their own dropdowns from the data
{ id: 'country', header: 'Country', accessor: r => r.country, filterType: 'select' }
{ id: 'region',  header: 'Region',  accessor: r => r.region,  filterType: 'select' }
```

**2. Static options — explicit list on the column**

Useful when the set of values is small and known ahead of time, or when you want a specific order.

```tsx
{ id: 'status', header: 'Status', accessor: r => r.status, filterType: 'select',
  filterOptions: ['active', 'inactive', 'pending'] }
```

**3. Server mode — async fetch via `fetchFilterOptions`**

When `dataMode="server"` you don't have the full dataset locally. Pass `fetchFilterOptions` to the grid and it calls it once per `select` column on mount, caching the results.

```tsx
<DataGrid
  dataMode="server"
  fetchFilterOptions={async (columnId) => {
    const res = await fetch(`/api/filter-options?column=${columnId}`)
    return res.json() // string[]
  }}
  ...
/>
```

To force a re-fetch (e.g. after the underlying data changes), change the function reference — typically by putting a refresh counter in `useCallback`'s dependency array:

```tsx
const [optionsVersion, setOptionsVersion] = useState(0)

const fetchFilterOptions = useCallback(async (columnId: string) => {
  const res = await fetch(`/api/filter-options?column=${columnId}&v=${optionsVersion}`)
  return res.json()
}, [optionsVersion])
```

---

## Number filter operators

Number columns (`filterType: 'number'`) show an operator picker next to the input. Supported operators:

| Symbol | Operator | Description |
|--------|----------|-------------|
| `=` | `eq` | Equals |
| `>` | `gt` | Greater than |
| `≥` | `gte` | Greater than or equal |
| `<` | `lt` | Less than |
| `≤` | `lte` | Less than or equal |
| `↔` | `between` | Between two values (shows min/max inputs) |

---

## Imperative ref API

```tsx
import { useRef } from 'react'
import { DataGrid, GridRef } from 'yk-grid'

const ref = useRef<GridRef<User>>(null)

<DataGrid ref={ref} ... />

ref.current.getSelectedRows()      // T[]
ref.current.getProcessedRows()     // T[] — sorted + filtered, no pagination
ref.current.getGridState()         // GridState
ref.current.clearSelection()
ref.current.exportCsv()                        // export all filtered rows
ref.current.exportCsv({ selectedOnly: true })  // export selected rows only
ref.current.setState({ sorts: [{ columnId: 'name', direction: 'asc' }] })
```

---

## Server-side mode

Set `dataMode="server"` and drive fetches from `onStateChange`. The callback only fires when sorts, filters, grouping, or pagination change — not on selection or column sizing events.

```tsx
const [data, setData] = useState<User[]>([])
const [rowCount, setRowCount] = useState(0)

async function handleStateChange(state: GridState) {
  const res = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(state),
  })
  const { rows, total } = await res.json()
  setData(rows)
  setRowCount(total)
}

<DataGrid
  data={data}
  columns={columns}
  getRowId={r => r.id}
  dataMode="server"
  rowCount={rowCount}
  onStateChange={handleStateChange}
/>
```

---

## Custom toolbar actions

```tsx
<DataGrid
  selectionMode="multiple"
  toolbarActions={({ selectedRows, clearSelection }) => (
    <button
      disabled={selectedRows.length === 0}
      onClick={() => { bulkDelete(selectedRows); clearSelection() }}
    >
      Delete ({selectedRows.length})
    </button>
  )}
  ...
/>
```

---

## AI integration

Pass an `ai` prop with your own server endpoint. The grid POSTs to that endpoint and applies the returned command to the grid state. An explanation is shown below the input, with a Clear button that resets all sorts and filters.

```tsx
<DataGrid
  ai={{
    endpoint: '/api/grid-ai',
    placeholder: 'e.g. show failed refunds over £200, sorted by amount'
  }}
  ...
/>
```

**Request body** (sent by the grid)

```json
{
  "prompt": "show failed refunds over £200 sorted by amount",
  "columns": [
    { "id": "status", "header": "Status", "filterType": "select" },
    { "id": "amount", "header": "Amount", "filterType": "number" }
  ],
  "currentState": { "sorts": [], "filters": [], "grouping": [] }
}
```

**Expected response**

```json
{
  "sorts": [{ "columnId": "amount", "direction": "asc" }],
  "filters": [
    { "columnId": "status",  "operator": "eq", "value": "failed"  },
    { "columnId": "type",    "operator": "eq", "value": "refund"  },
    { "columnId": "amount",  "operator": "gt", "value": 200       }
  ],
  "reset": false,
  "explanation": "Showing failed refunds over £200, sorted by amount ascending."
}
```

Set `"reset": true` to clear all sorts, filters, and grouping.

**Server-side proxy**

The `server/` directory contains a framework-agnostic handler (`gridAiRoute.ts`) and provider adapters for Anthropic (default) and OpenAI. Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in your environment. The API key never reaches the browser.

```ts
// Express
import { handleGridAiRequest } from './server/gridAiRoute'
app.post('/api/grid-ai', async (req, res) => {
  res.json(await handleGridAiRequest(req.body))
})

// Next.js App Router
import { handleGridAiRequest } from '@/server/gridAiRoute'
export async function POST(req: Request) {
  return Response.json(await handleGridAiRequest(await req.json()))
}
```

Switch to OpenAI by setting `LLM_PROVIDER=openai`.

---

## Theming

The grid exposes CSS custom properties on its root element. Set them on a parent or in a global stylesheet.

| Property | Default | Description |
|----------|---------|-------------|
| `--grid-border-colour` | `#e2e8f0` | Table and cell borders |
| `--grid-radius` | `4px` | Border radius on wrapper and inputs |
| `--grid-header-bg` | `#f8fafc` | Header row background |
| `--grid-row-hover-bg` | `#f8fafc` | Row hover background |
| `--grid-focus-ring` | `#6366f1` | Focus ring colour |
| `--grid-accent` | `#6366f1` | Checkbox accent colour |

```css
.my-grid {
  --grid-border-colour: #cbd5e1;
  --grid-radius: 8px;
  --grid-accent: #0ea5e9;
}
```

---

## Development

```bash
# run the example app (with AI middleware wired up)
npm run dev:example

# run tests
npm test

# type-check
npm run typecheck

# build the library
npm run build
```

Set `ANTHROPIC_API_KEY` in `example/.env.local` to use the AI command bar in development.

---

## Licence

MIT
