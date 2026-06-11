# Troubleshooting

---

## The grid is not sorting or filtering

**Check `dataMode`.** The default is `'server'`, which means the grid passes state to `onStateChange` but does not sort or filter rows itself. If you pass all your data and expect the grid to handle it, set `dataMode="client"`.

```tsx
// Wrong — dataMode defaults to 'server', so the grid does nothing with the data
<DataGrid data={allRows} ... />

// Correct
<DataGrid data={allRows} dataMode="client" ... />
```

---

## `onStateChange` fires on every render

You're likely passing an inline function that gets recreated on every render, but because the grid wraps the callback in a ref internally, `onStateChange` only fires when the query state (sorts, filters, grouping, pagination) actually changes. If you're seeing double-fires, check whether your server fetch function is triggering a state update that causes a re-render with different state.

Use `useCallback` to keep the function reference stable and avoid subtle dependency issues:

```tsx
const handleStateChange = useCallback(async (state: GridState) => {
  // fetch data
}, [])  // add any external dependencies here
```

---

## Select filter dropdown is empty

Three possible causes:

1. **`filterType: 'select'` is not set on the column.** Without it, the column uses `text` filtering.
2. **Server mode with no `fetchFilterOptions`.** In `dataMode="server"`, the grid can't derive options from the full dataset. Pass `fetchFilterOptions`:
   ```tsx
   fetchFilterOptions={async (colId) => {
     const res = await fetch(`/api/options?column=${colId}`)
     return res.json()
   }}
   ```
3. **`accessor` returns values that are not strings.** Auto-derivation in client mode calls `String(value)` on the accessor result. If `accessor` returns `null` or `undefined`, those values are skipped.

---

## Row count shows 0 in server mode

Set `rowCount` to the total number of matching rows from your API response. Without it, the pagination control has no way to know how many pages there are.

```tsx
<DataGrid
  dataMode="server"
  data={currentPageRows}
  rowCount={totalFromApi}   // ← required
  ...
/>
```

---

## `initialState` changes are ignored after mount

`initialState` is read once during the initial render and ignored on subsequent renders — it's not reactive. To change state after mount, use the imperative ref:

```tsx
ref.current?.setState({ filters: [...] })
```

---

## Column widths are out of sync with virtual scrolling

Both tables in the virtual-scroll layout share a `<colgroup>` element. If you set an explicit `width` on a column, make sure the value is a number (pixels), not a percentage — percentage widths are calculated differently in detached `<col>` elements.

```ts
// Good
{ id: 'name', width: 200 }

// May cause misalignment
{ id: 'name', width: '20%' as any }
```

---

## Sort or filter state is reset when I navigate away and back

State lives inside the component's `useReducer`. Unmounting and remounting the component resets it to `initialState`. To persist state across navigation:

- Encode it in the URL (see the [URL sync recipe](./recipes.md#syncing-state-back-to-url))
- Lift state to a parent component and pass it as `initialState` each time

---

## Portaled dropdowns (number filter, column menu) appear at `(0, 0)`

This happens in jsdom tests because `getBoundingClientRect()` returns all zeroes. The dropdowns will appear at `top: 0, left: 0` in the rendered output. This is not a bug — it's a jsdom limitation.

If you're testing filter interactions, assert on the input values and filter state rather than dropdown position:

```tsx
// Don't assert position
// expect(dropdown).toHaveStyle({ top: '200px' })

// Assert on behaviour
userEvent.click(filterIcon)
userEvent.type(input, '100')
expect(screen.getByDisplayValue('100')).toBeInTheDocument()
```

---

## Tests fail with `role="gridcell"` not found

jsdom does not implement the full ARIA role hierarchy, so `role="gridcell"` is not recognised. Use the raw DOM selector instead:

```tsx
// Fails in jsdom
screen.getAllByRole('gridcell')

// Works
container.querySelectorAll('tbody td')
```

Similarly, interactive rows with `role="button"` are missed by `getAllByRole('row')`:

```tsx
// May miss interactive rows
screen.getAllByRole('row')

// Always works
container.querySelectorAll('tbody tr')
```

---

## TypeScript: `Type 'string' is not assignable to type 'FilterOperator'`

The `operator` field in `FilterEntry` is a string union, not a plain `string`. Use `as const` or cast explicitly when constructing filter objects outside the grid:

```tsx
// Error
const filter = { columnId: 'status', operator: 'eq', value: 'active' }

// Fix
const filter = { columnId: 'status', operator: 'eq' as const, value: 'active' }
```

---

## AI bar does nothing / shows an error

1. **Missing API key** — check that `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) is set in your environment. For local dev, put it in `example/.env.local` (not the project root `.env`).
2. **Wrong endpoint** — the `ai.endpoint` prop must match the URL your server handles. For the Vite dev server, use `'/api/grid-ai'` exactly.
3. **Not running `dev:example`** — the AI middleware is registered in `vite.config.ts` and only runs when you start with `npm run dev:example`. Running `npm run dev` from the `example/` directory won't load the middleware.
4. **CORS** — if your grid is on a different origin from the AI endpoint, add appropriate CORS headers on the server.

---

## Build error: `Cannot find module 'yk-grid/server/gridAiRoute'`

The `server/` directory is not bundled. It's intended for use directly in Node.js environments (Express, Next.js). If you're trying to import it in a Vite or webpack frontend bundle, that's the issue.

Import it only from server-side code:

```ts
// ✓ Server file (Node.js)
import { handleGridAiRequest } from 'yk-grid/server/gridAiRoute'

// ✗ Client component — will fail
import { handleGridAiRequest } from 'yk-grid/server/gridAiRoute'
```

If your `tsconfig` or bundler follows the `types` field in `package.json`, add a path alias in your tsconfig to resolve the server path explicitly.
