# yk-grid

A production-ready React DataGrid component with built-in sorting, filtering, grouping, pagination, selection, column management, CSV export, virtual scrolling, and optional AI-assisted natural-language query input.

Dual-format library (ESM + CJS) with full TypeScript generics. Zero runtime dependencies beyond React and Zod.

---

## Features

- **Sorting** — multi-column, asc/desc, shift-click to stack
- **Filtering** — text, number (with operator picker), select, and date filter types
- **Grouping** — nest rows by one or more columns with collapse/expand
- **Aggregations** — sum, avg, count, min, max per group
- **Pagination** — client-side or server-side
- **Virtual scrolling** — renders only visible rows for large datasets (pass `height`)
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
  status: 'active' | 'inactive'
}

const columns: ColumnDef<User>[] = [
  { id: 'name',   header: 'Name',   accessor: r => r.name,   sortable: true, filterable: true },
  { id: 'email',  header: 'Email',  accessor: r => r.email,  sortable: true, filterable: true },
  { id: 'age',    header: 'Age',    accessor: r => r.age,    sortable: true, filterType: 'number' },
  { id: 'status', header: 'Status', accessor: r => r.status, sortable: true, filterType: 'select' },
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

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting started](docs/getting-started.md) | Install, quick-start, and common recipes |
| [Column definition](docs/columns.md) | All `ColumnDef` options with examples |
| [Sorting](docs/sorting.md) | Single and multi-column sort |
| [Filtering](docs/filtering.md) | Text, number, select, and date filters; filter operators |
| [Grouping & aggregations](docs/grouping.md) | Row grouping, expand/collapse, and aggregate values |
| [Pagination](docs/pagination.md) | Client-side and server-side pagination |
| [Selection](docs/selection.md) | Single and multiple row selection |
| [Server mode](docs/server-mode.md) | Drive data fetching from `onStateChange` |
| [Virtual scrolling](docs/virtual-scrolling.md) | Render only visible rows for large datasets |
| [AI integration](docs/ai-integration.md) | Natural-language command bar and server handler |
| [Toolbar & custom actions](docs/toolbar.md) | `toolbarActions` render prop and CSV export |
| [Imperative ref API](docs/imperative-ref.md) | Programmatic control via `GridRef` |
| [Theming](docs/theming.md) | CSS custom properties |
| [Type reference](docs/type-reference.md) | Full TypeScript type definitions |
| [Recipes](docs/recipes.md) | Real-world patterns and compositions |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and fixes |

---

## Props at a glance

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
| `onStateChange` | `(state: GridState) => void` | — | Fires when sorts, filters, grouping, or pagination change |

### Selection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Row selection behaviour |
| `selectAllScope` | `'page' \| 'filtered'` | `'page'` | What the select-all checkbox targets |
| `onSelectionChange` | `(rows: T[], ids: string[]) => void` | — | Fires when selection changes |

### Column features

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableColumnResize` | `boolean` | `false` | Drag-to-resize column widths |
| `enableColumnVisibility` | `boolean` | `false` | Show/hide column picker in header |

### Virtual scrolling

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number \| string` | — | Fixed height activates virtual scrolling |
| `estimatedRowHeight` | `number` | `41` | Hint for the virtualiser; affects scroll accuracy |

### Filtering

| Prop | Type | Description |
|------|------|-------------|
| `fetchFilterOptions` | `(columnId: string) => Promise<string[]>` | Server mode: called once per `select`-type column |

### Export

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableCsvExport` | `boolean` | `false` | Adds CSV export button to toolbar |
| `csvFilename` | `string` | `'export.csv'` | Downloaded file name |

### Toolbar

| Prop | Type | Description |
|------|------|-------------|
| `toolbarActions` | `(ctx) => ReactNode` | Render prop injected into the toolbar |

### AI

| Prop | Type | Description |
|------|------|-------------|
| `ai` | `{ endpoint: string; placeholder?: string }` | Enables the natural-language command bar |

### Other

| Prop | Type | Description |
|------|------|-------------|
| `initialState` | `Partial<GridState>` | Seed the grid with pre-set sorts, filters, grouping, etc. |
| `emptyState` | `ReactNode` | Custom content when there are no rows to display |
| `className` | `string` | Class applied to the root wrapper element |

---

## Development

```bash
npm run dev:example    # Vite dev server at localhost:5173
npm test               # vitest single pass
npm run test:watch     # vitest watch
npm run typecheck      # tsc --noEmit
npm run build          # typecheck + vite build → dist/
```

Set `ANTHROPIC_API_KEY` in `example/.env.local` to use the AI bar during development.

---

## Licence

MIT
