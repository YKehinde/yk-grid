# yk-grid — project context for Claude

## Commands

```bash
npm run dev:example    # Vite dev server at localhost:5173 (example app + AI middleware)
npm test               # vitest run (single pass)
npm run test:watch     # vitest watch
npm run typecheck      # tsc --noEmit (checks src/, server/, vite.config.ts)
npm run build          # typecheck + vite build (outputs to dist/)
```

## Architecture

This is a React component library. The public surface is a single generic component:

```
DataGrid<T>  —  src/components/DataGrid/DataGrid.tsx
```

Everything is co-located under `src/components/DataGrid/`:

```
types.ts          — all exported types (ColumnDef, DataGridProps, GridState, GridRef, etc.)
DataGrid.tsx      — root component; owns useReducer, memos, and all callbacks
DataGrid.module.css

state/            — pure functions and the reducer (no React)
  gridReducer.ts  — all GridActions and state transitions
  useGridState.ts — thin hook wrapping useReducer
  processRows.ts  — sort → filter → group pipeline (client mode)
  paginate.ts     — slice rows for the current page
  selection.ts    — resolveSelection helper
  aggregations.ts — sum/avg/count/min/max per group
  exportCsv.ts    — RFC 4180 CSV serialisation

ui/               — one file per visual component, each with a .module.css sibling
  HeaderCell      — sortable/resizable th; triggers column menu via onToggleMenu(id, rect)
  FilterControl   — per-column filter cell; delegates to NumberFilter for number type
  NumberFilter    — operator picker (portaled <ul>) + debounced input(s)
  ColumnMenu      — portaled column-visibility checklist
  Row / Cell      — data row and cell rendering
  GroupRow        — collapsible group header row
  SelectionCell   — checkbox td/th
  Pagination      — page controls
  Toolbar         — selection count, toolbarActions slot, CSV export
  AiBar           — AI command input, explanation strip, clear button

ai/
  schema.ts       — Zod schema for AiCommand (the LLM response contract)
  applyCommand.ts — maps AiCommand → GridAction[]
  aiClient.ts     — fetch wrapper that POSTs to the consumer's endpoint

server/           — server-side only; never imported by client bundle
  gridAiRoute.ts  — framework-agnostic handler (Express / Next.js App Router)
  providers/      — LlmProvider interface, AnthropicProvider, OpenAiProvider
```

## Key conventions

**State** lives entirely in `useReducer` inside `DataGrid.tsx`. No context, no external store. The reducer (`gridReducer.ts`) is pure — all actions are listed in `GridAction` as a discriminated union.

**Display rows** are a discriminated union `DisplayRow<T> = GroupHeaderRow | DataDisplayRow<T>`. Group header rows are interspersed with data rows in the render loop.

**Portals** — `NumberFilter`'s operator dropdown and `ColumnMenu` both use `ReactDOM.createPortal` to `document.body` with `position: fixed` coordinates from `getBoundingClientRect()`. This escapes the `overflow: hidden` on `.wrapper` and `overflow-x: auto` on `.tableContainer`. Any new popup or dropdown must do the same.

**Debounced filter inputs** — `FilterControl` and `NumberFilter` keep local state for responsive typing and debounce `onChange` by 300 ms. External state (from AI or `GridRef.setState`) syncs back into local state via `useEffect` watching the `value`/`operator` props.

**Select filter options** — two resolution paths:
- Client mode: `DataGrid` derives unique values from `data` via `useMemo` (stored in `derivedFilterOptions`)
- Server mode: consumer provides `fetchFilterOptions(columnId) => Promise<string[]>`; results cached in `fetchedFilterOptions` state

**CSS modules** — all component styles are in `.module.css` files. Global CSS custom properties (`--grid-*`) are used for theming; see README for the full list.

**TypeScript generics** — `DataGrid<T>` uses `forwardRef` cast pattern to preserve the `T` generic through `ref`. `GridRef<T>` is exported for typed imperative access.

## Testing

Tests live in `src/components/DataGrid/__tests__/`. Vitest + React Testing Library + jsdom.

Known JSDOM limitations that affect tests:
- `getBoundingClientRect()` returns zeroes — portaled dropdown positions will be `{ top: 0, left: 0 }`
- `role="gridcell"` isn't recognised — use `container.querySelectorAll('tbody td')` instead
- Interactive rows (`role="button"`) are missed by `getAllByRole('row')` — use `container.querySelectorAll('tbody tr')`

## Dev server / AI middleware

`vite.config.ts` registers a Connect middleware that intercepts `POST /api/grid-ai` and delegates to `server/gridAiRoute.ts`. This only works when running `npm run dev:example` (which passes `--config vite.config.ts` so Vite loads the config from the project root, not from `example/`).

Env vars are loaded from both the project root and `example/` so `.env.local` works in either location. `ANTHROPIC_API_KEY` is required for the AI bar to function.

## Build output

`vite build` produces:
- `dist/yk-grid.es.js` — ESM bundle
- `dist/yk-grid.cjs.js` — CJS bundle
- `dist/types/` — TypeScript declarations

`react`, `react-dom`, and `zod` are external (peer dependencies). The `server/` directory is never bundled.
