# Reusable AI-Assisted DataGrid — Build Plan

A production-ready, dependency-light React table component with per-column sort and
filter, grouping with aggregation, row selection, CSV export, column resizing and
visibility toggling, client- or server-side pagination, optional row/cell click
handlers, and a provider-agnostic AI assistant that turns natural language into
validated grid state. Designed so that downstream consumers — such as invoice
generation — can pull clean, typed row data (or the current query) out of the grid
with no friction.

Pivoting is **deliberately deferred to v2** (see Roadmap) — it is materially more
complex than grouping and interacts awkwardly with server mode, so v1 ships grouping
with aggregation instead.

The grid does **no data fetching of its own.** In server mode it is a controlled
component: it owns `GridState` and emits it; the consumer performs the fetch with
whatever they like (TanStack Query, SWR, a bare `fetch`). No data-layer dependency
ships with the grid.

## Decisions locked in

| Area | Choice | Why it matters |
|---|---|---|
| Grid foundation | Built from scratch (React + TS) | Zero licence, zero runtime deps, full control of markup and a11y. |
| AI transport | Server-side proxy route | API key never reaches the browser. Client swaps one env var on handover. |
| AI contract | Structured grid-state JSON, schema-validated | Deterministic, safe, and genuinely provider-agnostic. The LLM cannot run code — it can only emit a filter/sort command against known columns. |
| Packaging | Self-contained in-repo folder | Drop the folder into the client repo, no publish pipeline. |
| Styling | CSS custom properties (tokens) | Client rebrands by overriding variables, no code changes. |
| Data & pagination | `dataMode: 'client' \| 'server'`, default `server` | Server mode = controlled component, backend paginates and processes. No fetching library baked in; consumer wires the call (TanStack Query etc.) later. |
| Data shape | Generic `T`, flat JSON records | No fixed schema, no column inference. Grid reads values only via `accessor`/`getRowId`. Tree/hierarchical data is out of scope. |

## Core principle

There is **one source of truth**: `GridState = { sorts, filters, grouping, selection,
expanded, pagination, columnSizing, columnVisibility }`. Everything — manual header
clicks, filter inputs, selection checkboxes, column resize/hide, page changes, and the
AI — produces the *same* state shape through the *same* reducer. The AI is not a special path; it just emits a command
that the reducer already knows how to apply. That keeps the AI safe, testable, and
removable without touching the grid.

```
CLIENT MODE                                         SERVER MODE (controlled)
User action  ─┐                                     User action ─┐
Filter input ─┼▶ reducer ▶ GridState ▶ processRows  Filter input ┼▶ reducer ▶ GridState
Selection    ─┤                ▲          │ slice      Selection  ─┤             │ emit
AI command   ─┘                │          ▼            AI command ─┘             ▼
                       validated JSON   render                       onStateChange(state)
                                                                              │
                                                          consumer fetch (TanStack/SWR/fetch)
                                                                              ▼
                                                          data + rowCount ▶ grid renders

selection / gridState ─▶ getSelectedRows(): T[]  ──▶ CSV export
                     └─▶ getGridState(): query   ──▶ invoice builder ("all matching")
```

### Two kinds of data, kept separate

This distinction underpins selection, export, and invoicing:

- **Display rows** — the filtered/grouped/sorted/flattened result, including group
  header rows. Used only for rendering.
- **Source rows** — the original typed `T` objects the consumer passed in. Selection
  is tracked by `getRowId`, and **selection always resolves back to source `T`
  objects**, never to display rows. That is what makes CSV export and invoice
  generation trivial: they receive full-fidelity domain data, not formatted cells.

## File structure

```
src/components/DataGrid/
  DataGrid.tsx              Public component + props (the only export consumers touch)
  types.ts                 ColumnDef, GridState, AiCommand, prop types
  state/
    gridReducer.ts         Pure reducer: SET_SORT, SET_FILTER, SET_GROUPING, SET_PAGE,
                           SET_COLUMN_SIZE, SET_COLUMN_VISIBILITY, TOGGLE_SELECT,
                           TOGGLE_EXPAND, APPLY_AI, RESET
                           (filter/sort/group changes reset pageIndex to 0)
    useGridState.ts        useReducer wrapper + helpers
    processRows.ts         Pure pipeline: filter → group → aggregate → sort → flatten
                           (sort order under grouping is specified — see below)
    aggregations.ts        sum / avg / count / min / max per group
    selection.ts           Selection set helpers; resolves ids → source T[]
    exportCsv.ts           Pure: rows + columns → CSV string (+ download trigger)
    paginate.ts            Pure: client-mode page slice; pager maths for both modes
  ai/
    schema.ts              Zod schema for AiCommand (single source of the contract)
    aiClient.ts            Browser → POST /api/grid-ai, returns validated AiCommand
    applyCommand.ts        Maps AiCommand → reducer actions; rejects unknown columns
  ui/
    HeaderCell.tsx         Sort toggle + aria-sort + keyboard support + resize handle
    FilterControl.tsx      text / number / select / date by column.filterType
    GroupRow.tsx           Group header row: label, aggregates, expand/collapse
    ColumnMenu.tsx         Show/hide columns (visibility toggling)
    SelectionCell.tsx      Row checkbox; header select-all honours selectAllScope
    Pagination.tsx         Page controls; reads rowCount (server) or derived count (client)
    Toolbar.tsx            Selection count, export button, column menu, consumer action slot
    Row.tsx, Cell.tsx      Conditional click wiring (see below)
    AiAssistant.tsx        Prompt input, loading/error states, "what it did" summary
  DataGrid.module.css      Layout + tokens (--grid-*) consumers can override
  __tests__/               Unit + component tests
  index.ts                 Barrel export (component + types + GridRef)

server/                    Example proxy the client adapts (Express/Next/Fastify)
  gridAiRoute.ts           Holds the key, validates, calls provider
  providers/
    types.ts               LlmProvider interface
    anthropic.ts           Default (your Claude key)
    openai.ts              Stub showing the same interface
```

## Public API (the contract consumers depend on)

```ts
interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: (row: T) => string | number | Date | null;
  cell?: (value: unknown, row: T) => React.ReactNode; // custom render
  exportValue?: (row: T) => string | number;          // CSV value (falls back to accessor)
  sortable?: boolean;        // default true
  filterable?: boolean;      // default true
  groupable?: boolean;       // can this column be grouped by?
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'; // shown on group rows
  filterType?: 'text' | 'number' | 'select' | 'date';
  width?: number;            // initial width
  minWidth?: number;         // resize floor
  resizable?: boolean;       // default true
  hideable?: boolean;        // default true; appears in the column menu
  defaultHidden?: boolean;   // start hidden, user can reveal
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;

  // Optional interactivity — absent handler = no interactivity for that target
  onRowClick?: (row: T, index: number, e: React.MouseEvent) => void;
  onCellClick?: (value: unknown, row: T, column: ColumnDef<T>, e: React.MouseEvent) => void;

  // Data mode + pagination.
  dataMode?: 'client' | 'server';   // default 'server'
  pageSize?: number;                // initial; user can change
  // SERVER MODE ONLY — grid is controlled, consumer fetches:
  rowCount?: number;                // total matching rows, for the pager
  loading?: boolean;                // drives skeleton/spinner overlay
  onStateChange?: (state: GridState) => void; // fires on any sort/filter/group/page change

  // Selection — opt-in. 'none' (default) renders no checkboxes.
  selectionMode?: 'none' | 'single' | 'multiple';
  selectAllScope?: 'page' | 'filtered'; // see note; 'page' default in server mode
  onSelectionChange?: (rows: T[], ids: string[]) => void; // always source T objects

  // Export — opt-in toolbar button. filename optional.
  enableCsvExport?: boolean;
  csvFilename?: string;

  // Column controls — both default on; persisted in GridState so they round-trip.
  enableColumnResize?: boolean;     // default true
  enableColumnVisibility?: boolean; // default true; renders the column menu

  // Consumer action slot — render-prop given live selection. THIS is where an
  // "Create invoice" button lives, without the grid knowing what an invoice is.
  toolbarActions?: (ctx: {
    selectedRows: T[];
    selectedIds: string[];
    processedRows: T[]; // current filtered/sorted source rows (loaded page in server mode)
    gridState: GridState; // the live query — for "invoice everything matching the filter"
    clearSelection: () => void;
  }) => React.ReactNode;

  // AI is opt-in. No endpoint = no assistant rendered.
  ai?: { endpoint: string; placeholder?: string };

  initialState?: Partial<GridState>;
  emptyState?: React.ReactNode;
  className?: string;
}

// Imperative escape hatch for parents that prefer refs over render props.
interface GridRef<T> {
  getSelectedRows: () => T[];
  getProcessedRows: () => T[];   // current filtered/sorted source rows (loaded page in server mode)
  getGridState: () => GridState; // the live query, for invoice-by-filter / server export
  clearSelection: () => void;
  exportCsv: (opts?: { selectedOnly?: boolean }) => void;
  setState: (partial: Partial<GridState>) => void;
}
```

### Optional click behaviour (as requested)

Click ability is driven entirely by handler presence:

- `onRowClick` undefined → row renders as a plain `<tr>`: no `cursor: pointer`, no
  `role`/`tabIndex`, no `onClick`. It is inert.
- `onRowClick` defined → row gets `cursor: pointer`, `role="button"`, `tabIndex={0}`,
  Enter/Space keyboard activation, and the click handler.
- `onCellClick` follows the same rule per cell, and `stopPropagation` so a cell click
  doesn't also fire the row click unless you want it to.

This is enforced in `Row.tsx`/`Cell.tsx` with a single `const interactive = !!handler`
guard, so the behaviour is impossible to get wrong by accident.

## Data contract

The grid is generic over the row type `T` and imposes **no schema**. It requires only
an array of flat objects; it never reads a field by name, only through `accessor`
(per column) and `getRowId` (identity). Column inference is intentionally not
provided — columns are declared explicitly for typing, formatting, correct
`filterType`, and a11y labels.

The grid consumes flat JSON records from whatever source the consumer has. In server
mode the API's envelope (`{ items, total }`, `{ results, count }`, etc.) is mapped to
the `data` and `rowCount` props in the consumer's fetch layer — the single, explicit
adapter point that keeps the grid blind to the wire format.

> **Type-coercion callout — values must be real primitives at the source boundary.**
> Sort, filter and grouping rely on `accessor` returning a real primitive (`number`,
> `Date`, `string`, `null`). If a backend serves "stringly typed" values — `"1,200"`,
> `"2024-03-01"`, `"true"` (common when data originates from spreadsheets, CSV exports,
> or loosely typed stores) — they will sort lexically and break numeric/date filters.
> Coerce types at the data boundary (in the API, or inside each `accessor`) so the grid
> reasons over real primitives. This is upstream of the grid and source-agnostic, but
> it decides whether sorting and filtering behave correctly.

## Data modes & pagination

Pagination forces a decision the rest of the design hangs off: **you cannot paginate
server-side and process client-side.** Sorting one page is not sorting. So the data
operations (sort, filter, group) live wherever the pagination lives. The grid supports
both via `dataMode`, and the *same* `GridState` drives each.

**Client mode** (`dataMode="client"`). The consumer passes the full `data`. The grid
runs the `processRows` pipeline and paginates its *output*. No backend involvement.
Right for datasets up to a few thousand rows.

**Server mode** (`dataMode="server"`, the default). The grid is a **controlled
component**: it owns `GridState`, processes nothing, and renders the `data` +
`rowCount` it is handed. On any change to sort / filter / group / page it calls
`onStateChange(state)`. That state object is everything a backend needs to build a
request — it is, in effect, the query key.

```ts
// Consumer side — grid stays agnostic, fetching is entirely yours (now or later).
const [gridState, setGridState] = useState(initialGridState);
const { data, rowCount, isLoading } = useMyFetch(gridState); // TanStack/SWR/fetch — your call

<DataGrid
  dataMode="server"
  data={data}
  rowCount={rowCount}
  loading={isLoading}
  onStateChange={setGridState}
  columns={cols}
  getRowId={r => r.id}
/>
```

No fetching library is bundled. Wiring the call (TanStack Query, with
`keepPreviousData`, debounced filters and next-page prefetch) is a later,
consumer-side decision and changes nothing inside the grid.

Two behavioural notes that fall out of server mode:

- **Filters/sort reset the page to 0.** Changing what you're looking at returns you to
  page one; the reducer handles this so every consumer behaves the same.
- **The AI does not drive pagination.** `AiCommand` covers filter/sort/group, not
  page navigation — the AI changes *what* the data is, and the page resets as above.

### Sort semantics under grouping (decide before building `processRows`)

Grouping makes "sort" ambiguous, so the pipeline fixes one explicit rule rather than
leaving it to chance:

- A sort on a **grouping column** orders the **groups themselves** (e.g. group by
  region, region descending → groups appear Z→A).
- A sort on a **non-grouping column** orders **rows within each group** (e.g. within
  each region, sort rows by revenue descending).
- Both can be active at once; group ordering and within-group ordering are independent.
- Groups are **not** ordered by their aggregate value in v1 (e.g. "regions sorted by
  total revenue"). That is a v2 opt-in (`sortGroupsBy: 'aggregate'`) — it is a
  genuinely different operation and is called out in the Roadmap.

This keeps `processRows` deterministic: `filter → group → aggregate → sort`, where the
sort step applies the two rules above in a single pass. In server mode the backend
must honour the same contract, which is why it's stated here rather than discovered in
code.

### The one decision that needs a backend contract: `selectAllScope`

In server mode the unloaded pages aren't in the browser, so the header "select all"
checkbox has two possible meanings:

- `'page'` (default) — selects the rows currently loaded. No backend work. Safe and
  obvious.
- `'filtered'` — "everything matching the current filter", including rows not loaded.
  This **requires backend support**: either an endpoint returning all matching ids, or
  pushing the selection down as a `selectAllMatchingFilter` flag the consumer's API
  honours.

I've set `'page'` as the default so nothing breaks without a backend. For your
client's "invoice/export everything matching" case, the cleaner route is usually not
selecting thousands of rows at all — it's passing the **filter itself** to the
backend via `gridState` (see egress, below).

## The AI layer (truly agnostic)

**Browser side** sends only metadata, never data rows:

```ts
POST /api/grid-ai
{ prompt, columns: [{ id, header, filterType }], currentState }
```

**Server side** holds the key and abstracts the provider behind one interface:

```ts
interface LlmProvider { complete(system: string, user: string): Promise<string>; }
```

`anthropic.ts` is the default (your key). Swapping to OpenAI/Google is a new file
implementing the same interface plus an env switch — the rest of the system is
untouched. The handover to the client is: set `LLM_API_KEY` (and optionally
`LLM_PROVIDER`). Nothing else changes.

**The contract** the model must return is fixed JSON, validated by the *same* Zod
schema on both ends:

```ts
const AiCommand = z.object({
  sorts: z.array(z.object({
    columnId: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  filters: z.array(z.object({
    columnId: z.string(),
    operator: z.enum(['eq','contains','gt','lt','between','in']),
    value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  })).optional(),
  grouping: z.array(z.string()).optional(),      // column ids to group by, in order
  reset: z.boolean().optional(),
  explanation: z.string(), // shown to the user: "Grouped by region, summed revenue ↓"
});
```

So "filter to active and group by region" becomes the *same* validated command shape
as a plain filter — and `applyCommand` still drops any column id you didn't pass in.
Grouping inherits the safety and agnosticism of the original contract for free.

> **v2 / pivot — mode exclusivity by construction.** Grouping (flat rows in groups)
> and pivoting (a cross-tab) are *mutually exclusive display modes* — a grid is in one
> or the other, never both. When pivot lands, the command should become a discriminated
> union on a `mode` field, e.g. `{ mode: 'flat', grouping } | { mode: 'pivot', pivot }`,
> so an invalid response that tries to set both fails Zod validation rather than
> leaving the reducer to silently reconcile them. Building grouping alone in v1 sidesteps
> the ambiguity entirely; the union is the right shape to adopt the moment pivot exists.

Safety properties this buys you: the model can only target columns you passed in
(`applyCommand` drops anything else), values are type-checked, and a malformed
response fails validation and surfaces a friendly error rather than corrupting state.
No `eval`, no arbitrary queries, no data leaving the client unless the client's own
backend chooses to send it.

## Data egress: export and invoice-readiness

The client doesn't want invoicing *in* the grid — they want it *easy to reach from*
the grid. The design delivers that with one rule: **selection resolves to source
`T[]`, exposed through both a render prop and a ref.** Everything downstream is a
consumer of that array.

- **CSV export** is the first consumer, shipped in-grid. `exportCsv.ts` is a pure
  `(rows, columns) => string` using each column's `exportValue` (or `accessor`),
  correctly quoting/escaping. The toolbar button exports the selection, or all
  filtered rows when nothing is selected.
- **Invoicing** is the client's consumer, *not* in the grid. They drop a button into
  `toolbarActions` and receive both `selectedRows: T[]` (the original domain objects)
  and `gridState` (the live query). That covers both invoicing shapes:

  ```tsx
  <DataGrid
    dataMode="server"
    data={page} rowCount={total} loading={isLoading}
    onStateChange={setGridState}
    columns={cols}
    getRowId={r => r.id}
    selectionMode="multiple"
    enableCsvExport
    toolbarActions={({ selectedRows, gridState, clearSelection }) => (
      <button
        onClick={() =>
          selectedRows.length
            ? createInvoiceFromRows(selectedRows)   // explicit picks — full-fidelity T[]
            : createInvoiceFromQuery(gridState)     // "everything matching this filter"
        }
      >
        Create invoice {selectedRows.length ? `(${selectedRows.length})` : '(all matching)'}
      </button>
    )}
  />
  ```

Because the grid never reshapes or stringifies the selected rows, the invoice builder
gets full-fidelity, fully typed data; and because it also exposes `gridState`,
"invoice everything matching" works without dragging unloaded rows into the browser.
Nothing about invoicing leaks into the grid, and swapping CSV for PDF, an API call, or
anything else is a change in the consumer only.

In server mode, the same split applies to CSV export: exporting the **selection** or
the **loaded page** is client-side and free; exporting **all filtered rows** is a
server export endpoint the consumer points at, fed by `gridState`.

## Build phases

Unit tests are written **with each phase**, not deferred — every pure module
(`processRows`, `aggregations`, `selection`, `exportCsv`, `applyCommand`, the Zod
schema) lands with its tests in the same phase. The final phase is integration/E2E and
docs only, not first-time coverage. This avoids refactoring `processRows` and friends
under no test coverage.

1. **Skeleton + types** — `ColumnDef`, `GridState` (incl. `pagination`, `columnSizing`,
   `columnVisibility`), render a static table from `data`/`columns` with custom `cell`
   support and the empty state.
2. **Sort** — `HeaderCell` toggle (asc → desc → none), multi-column sort in
   `processRows`, `aria-sort`, keyboard activation. *(+ unit tests)*
3. **Filter** — `FilterControl` per `filterType`, debounced text input, wired through
   the reducer. *(+ unit tests)*
4. **Data modes + pagination** — `dataMode` split, `Pagination`, client-mode slice in
   `paginate.ts`, server-mode controlled wiring (`onStateChange`, `rowCount`,
   `loading`), page-reset-on-filter rule. Establish this early — selection, export and
   AI all build on top of it. *(+ unit tests)*
5. **Grouping + aggregation** — `grouping` state, group/aggregate stage in
   `processRows`, `GroupRow` with expand/collapse and per-group aggregates, and the
   **grouped sort semantics decided above**. *(+ unit tests for processRows + aggregations)*
6. **Selection** — `SelectionCell`, single/multiple modes, `selectAllScope`
   (`page` default), `onSelectionChange` emitting source `T[]`. *(+ unit tests)*
7. **Export + toolbar** — `exportCsv.ts`, `Toolbar` with selection count, export
   button, and the `toolbarActions` slot (exposing `gridState`). Wire the `GridRef`
   handle. *(+ unit tests)*
8. **Column resizing + visibility** — resize handle in `HeaderCell` writing
   `columnSizing`; `ColumnMenu` toggling `columnVisibility`; both persisted in
   `GridState`. *(+ unit/component tests)*
9. **Click handlers** — conditional interactivity in `Row`/`Cell` per the rules above.
10. **AI assistant (client)** — panel, `aiClient`, `applyCommand` (filter/sort/group),
    loading/error/summary states. **Request cancellation is built here, not bolted on:**
    an `AbortController` cancels any in-flight AI request when the user issues a new one
    or edits filters, with a timeout. The grid stays usable if the AI is absent/fails.
    *(+ unit tests for applyCommand + schema)*
11. **AI proxy (server)** — example route, `LlmProvider` interface, Anthropic default,
    OpenAI stub, env-based key/provider.
12. **Theming + a11y polish** — CSS variables, focus rings, responsive overflow,
    reduced-motion, screen-reader labels.
13. **Integration, E2E + docs** — component/integration tests across modes, optional
    Playwright happy-paths, and a README with copy-paste usage, the server-mode fetch
    contract, and the env contract for the client.

## Testing strategy

Written per-phase (see build phases), not deferred.

- **Pure functions (highest value):** `processRows` (sort/filter/group combinations
  incl. the grouped-sort rule, nulls, type coercion), `aggregations`
  (sum/avg/count/min/max, empty groups), `selection` (ids resolve to correct source
  `T[]`), `exportCsv` (escaping, quoting, `exportValue` fallback), `applyCommand`
  (unknown columns rejected, ops mapped correctly), Zod schema (good and malformed
  payloads).
- **Component (RTL):** header click cycles sort; filter input updates rows; group
  expand/collapse and grouped-sort ordering; column resize writes width; column menu
  hides/shows; select-all respects `selectAllScope`; row is inert without `onRowClick`
  and a button with it; cell click stops propagation; `toolbarActions` receives the
  right selection *and* `gridState`. **Server mode:** filter/sort/page change fires
  `onStateChange` with the correct state and resets the page; the grid renders
  `data`/`rowCount` it's given without re-processing; `loading` shows the overlay.
- **AI panel:** mock `/api/grid-ai` — success applies state (filter, sort, group),
  validation failure shows the error and leaves state untouched, and a new request
  aborts the previous one.
- **Optional E2E (Playwright):** "type a prompt → grid updates", and
  "select rows → export CSV / trigger consumer action".

## Production considerations

- **Performance:** memoise `processRows`; virtualization (windowing) is a v2 item if
  datasets exceed a few thousand rows in client mode — kept out of v1 to stay simple.
- **Resilience:** AI request cancellation/timeout is implemented in phase 10 (not a
  footnote); the grid never blocks on the AI.
- **Server hardening:** rate-limit the route, cap prompt length, never log the key,
  return generic errors to the client.
- **a11y:** semantic `<table>`, `aria-sort`, labelled filter controls, full keyboard
  path for sort and interactive rows.

## Scope: v1 vs v2

**v1** — filter, sort, grouping with aggregation, row selection, CSV export, column
resizing and visibility, client/server pagination, optional click handlers, and the AI
assistant across filter/sort/group — plus the egress surface that makes invoicing a
downstream consumer.

**v2 / Roadmap** — deferred deliberately, each because it adds real complexity rather
than because it was forgotten:

- **Pivoting.** Dynamic column generation, column-dimension intersections, empty-cell
  semantics, and an awkward server-mode `onStateChange` shape (the emitted columns are
  data-dependent). Lands as a discriminated-union `mode` on `AiCommand`/`GridState` so
  it's mutually exclusive with grouping by construction.
- **Sort groups by aggregate** (`sortGroupsBy: 'aggregate'`) — ordering groups by their
  summed/averaged value, a distinct operation from the v1 grouped-sort rules.
- **Row virtualization / windowing** — for large client-mode datasets.
- **Tree / hierarchical data** — rows that contain child rows (distinct from grouping).
- **AI-driven column visibility** — "hide the email column" — a natural schema
  extension once visibility lives in `GridState` (which it now does).

Two sequencing notes. First, phases 1–9 deliver a complete, useful grid with no AI;
the AI (phases 10–11) bolts on without changing any of it — a clean release split if
the timeline tightens. Second, every v2 item above has its seam already cut in v1
(`GridState` shape, the command contract, the egress surface), so none of them require
reworking what ships first.
