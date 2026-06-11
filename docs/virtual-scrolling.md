# Virtual scrolling

Virtual scrolling renders only the rows currently visible in the viewport, keeping DOM node count constant regardless of dataset size. This makes large datasets (10 000+ rows) fast to render and scroll.

---

## Enabling virtual scrolling

Pass a `height` prop. Without it, the table grows to its natural height and all rows are in the DOM.

```tsx
// Fixed pixel height
<DataGrid height={600} ... />

// CSS string (any valid height value)
<DataGrid height="80vh" ... />
<DataGrid height="calc(100vh - 200px)" ... />
```

---

## Row height hint

The virtualiser needs to estimate row heights before rows are rendered so it can calculate scroll positions and total scroll height. Set `estimatedRowHeight` to match your actual row height as closely as possible.

```tsx
<DataGrid
  height={600}
  estimatedRowHeight={48}   // default: 41
  ...
/>
```

If your rows vary in height, set this to the average. Slight inaccuracies are corrected automatically as the user scrolls, but large mismatches cause a jump when scrolling to the end.

---

## Overscan

The virtualiser renders a buffer of 8 rows above and below the visible area (`overscan: 8`). This prevents flashes of empty space during fast scrolling. This value is not currently configurable via props.

---

## Layout details

When virtual scrolling is active, the grid uses a **two-table layout**:

- A fixed header table that never moves vertically, aligned with the scroll container via a shared `colgroup`.
- A scrollable body container (`overflow-y: auto`) with its own table.

Both tables use identical `<colgroup>` elements, so column widths stay in sync as the user resizes columns.

The outer wrapper handles horizontal scrolling for both tables simultaneously.

---

## Virtual scrolling with grouping

Virtual scrolling and grouping work together. Group header rows are treated as regular display rows by the virtualiser — they count against the row total and are skipped over when collapsed, just like regular rows.

---

## Virtual scrolling with selection

Select-all when `selectAllScope="page"` selects the rows currently rendered in the virtual viewport (the "page" of visible rows). Use `selectAllScope="filtered"` to select across all filtered rows regardless of what's visible:

```tsx
<DataGrid
  selectionMode="multiple"
  selectAllScope="filtered"
  height={600}
  ...
/>
```

---

## When to use virtual scrolling

| Scenario | Recommendation |
|----------|---------------|
| < 500 rows, client mode | Not needed — standard layout is simpler |
| 500–5 000 rows | Consider it, especially if rows contain images or complex JSX |
| 5 000+ rows | Use it — standard rendering will be noticeably slow |
| Server mode (you control page size) | Usually not needed — keep page size ≤ 100 |

---

## Caveats

- `height` must be a concrete value (pixels or a CSS expression that resolves to a fixed height). Setting `height="auto"` or omitting it disables virtual scrolling.
- Row measurement is estimated, not measured. If your custom `cell` renderers have variable heights that are very different from `estimatedRowHeight`, the scroll bar thumb may jump as you scroll.
- `getBoundingClientRect()` returns zeroes in jsdom. Tests that assert virtual row positions will need to mock it. See [Troubleshooting](./troubleshooting.md).
