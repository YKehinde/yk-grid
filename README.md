# yk-grid

A production-ready React DataGrid component with built-in sorting, filtering, grouping, pagination, selection, column management, CSV export, and optional AI-assisted query input.

Distributed as a dual-format library (ESM + CJS) with full TypeScript types. Zero runtime dependencies beyond React and Zod.

---

## Features

- **Sorting** — multi-column, asc/desc
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
  { id: 'age',   header: 'Age',   accessor: r => r.age,   sortable: true, filterType: 'number', aggregation: 'avg' },
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
| `dataMode` | `'client' \| 'server'` | `'client'` | Client handles sort/filter/page locally; server mode passes state via `onStateChange` |
| `pageSize` | `number` | `20` | Rows per page |
| `rowCount` | `number` | — | Total row count for server-side pagination |
| `loading` | `boolean` | `false` | Shows loading state |
| `onStateChange` | `(state: GridState) => void` | — | Fires on every state change — use to drive server-side fetches |

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
| `enableColumnVisibility` | `boolean` | `false` | Show/hide column picker in toolbar |

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
| `ai` | `{ endpoint: string; placeholder?: string }` | Enables the natural-language command bar. Sends prompts to your own server endpoint (see [AI integration](#ai-integration)) |

### Other

| Prop | Type | Description |
|------|------|-------------|
| `initialState` | `Partial<GridState>` | Seed the grid with pre-set sorts, filters, grouping, etc. |
| `emptyState` | `ReactNode` | Custom empty state when there are no rows |
| `className` | `string` | Class applied to the root element |

---

## Column definition

```ts
interface ColumnDef<T> {
  id: string
  header: string
  accessor: (row: T) => string | number | Date | null

  // rendering
  cell?: (value: unknown, row: T) => ReactNode
  exportValue?: (row: T) => string | number

  // features
  sortable?: boolean
  filterable?: boolean
  groupable?: boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'

  // filter type
  filterType?: 'text' | 'number' | 'select' | 'date'
  filterOptions?: string[]   // required when filterType='select'

  // sizing & visibility
  width?: number
  minWidth?: number
  resizable?: boolean
  hideable?: boolean
  defaultHidden?: boolean
}
```

---

## Imperative ref API

```tsx
import { useRef } from 'react'
import { DataGrid, GridRef } from 'yk-grid'

const ref = useRef<GridRef<User>>(null)

<DataGrid ref={ref} ... />

// available methods:
ref.current.getSelectedRows()      // T[]
ref.current.getProcessedRows()     // T[] (sorted + filtered)
ref.current.getGridState()         // GridState
ref.current.clearSelection()
ref.current.exportCsv({ selectedOnly: true })
ref.current.setState({ sorts: [{ columnId: 'name', direction: 'asc' }] })
```

---

## Server-side mode

Set `dataMode="server"` and use `onStateChange` to fetch data whenever the grid state changes.

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
  ...
  selectionMode="multiple"
  toolbarActions={({ selectedRows, clearSelection }) => (
    <button
      disabled={selectedRows.length === 0}
      onClick={() => { bulkDelete(selectedRows); clearSelection() }}
    >
      Delete ({selectedRows.length})
    </button>
  )}
/>
```

---

## AI integration

Pass an `ai` prop with your own server endpoint. The grid POSTs a JSON body and expects a response matching the command schema.

```tsx
<DataGrid
  ...
  ai={{ endpoint: '/api/grid-ai', placeholder: 'e.g. show completed orders over £500' }}
/>
```

**Request body**

```json
{
  "prompt": "show completed orders over £500",
  "columns": [{ "id": "status", "header": "Status", "filterType": "select" }, ...],
  "currentState": { ... }
}
```

**Expected response**

```json
{
  "sorts": [{ "columnId": "amount", "direction": "desc" }],
  "filters": [
    { "columnId": "status", "operator": "eq", "value": "completed" },
    { "columnId": "amount", "operator": "gt", "value": 500 }
  ],
  "grouping": [],
  "explanation": "Showing completed orders with amount greater than £500, sorted by amount descending."
}
```

The `server/` directory contains an example proxy route (`gridAiRoute.ts`) and provider stubs for Anthropic and OpenAI. The API key never leaves the server.

---

## Development

```bash
# run the example app
npm run dev:example

# run tests
npm test

# type-check
npm run typecheck

# build the library
npm run build
```

---

## Licence

MIT
