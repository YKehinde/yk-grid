---
title: Server mode
render_with_liquid: false
---

# Server mode

Server mode is for datasets that live on the server and can't (or shouldn't) be sent to the browser all at once. The grid maintains its UI state internally but delegates sorting, filtering, and pagination to your backend.

---

## Setting it up

```tsx
'use client'  // Next.js App Router

import { useState, useCallback } from 'react'
import { DataGrid } from 'yk-grid'
import type { ColumnDef, GridState } from 'yk-grid'

interface Order {
  id: string
  customer: string
  total: number
  status: string
  createdAt: string
}

const columns: ColumnDef<Order>[] = [
  { id: 'customer',  header: 'Customer',  accessor: r => r.customer,  sortable: true, filterable: true },
  { id: 'total',     header: 'Total',     accessor: r => r.total,     sortable: true, filterType: 'number' },
  { id: 'status',    header: 'Status',    accessor: r => r.status,    sortable: true, filterType: 'select' },
  { id: 'createdAt', header: 'Date',      accessor: r => r.createdAt, sortable: true, filterType: 'date' },
]

export default function OrdersPage() {
  const [data, setData]         = useState<Order[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading]   = useState(false)

  const handleStateChange = useCallback(async (state: GridState) => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page:     state.pagination.pageIndex,
          pageSize: state.pagination.pageSize,
          sorts:    state.sorts,
          filters:  state.filters,
        }),
      })
      const { rows, total } = await res.json()
      setData(rows)
      setRowCount(total)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <DataGrid<Order>
      data={data}
      rowCount={rowCount}
      columns={columns}
      getRowId={r => r.id}
      dataMode="server"
      pageSize={50}
      loading={loading}
      onStateChange={handleStateChange}
    />
  )
}
```

---

## What `onStateChange` fires on

`onStateChange` fires when any of these change:

- `sorts`
- `filters`
- `grouping`
- `pagination` (page index or page size)

It does **not** fire for:

- Selection changes
- Column resizing
- Column visibility toggling

This means fetching only happens when it would actually affect the rows returned.

---

## Firing the initial fetch

`onStateChange` fires on mount with the initial state, so your data fetch runs automatically the first time the component renders. If you're using `initialState`, it fires with those values already applied.

---

## Building the API endpoint

The `GridState` shape passed to `onStateChange`:

```ts
interface GridState {
  sorts:     Array<{ columnId: string; direction: 'asc' | 'desc' }>
  filters:   Array<{ columnId: string; operator: string; value: unknown }>
  grouping:  string[]
  pagination: { pageIndex: number; pageSize: number }
  // selection, expanded, columnSizing, columnVisibility also present
  // but not relevant to server data fetching
}
```

An Express endpoint that handles this:

```ts
import { Request, Response } from 'express'

app.post('/api/orders', async (req: Request, res: Response) => {
  const { page = 0, pageSize = 50, sorts = [], filters = [] } = req.body

  let query = db('orders')

  // Apply filters
  for (const filter of filters) {
    switch (filter.operator) {
      case 'eq':       query = query.where(filter.columnId, filter.value);    break
      case 'contains': query = query.whereILike(filter.columnId, `%${filter.value}%`); break
      case 'gt':       query = query.where(filter.columnId, '>', filter.value); break
      case 'gte':      query = query.where(filter.columnId, '>=', filter.value); break
      case 'lt':       query = query.where(filter.columnId, '<', filter.value); break
      case 'lte':      query = query.where(filter.columnId, '<=', filter.value); break
      case 'between':  query = query.whereBetween(filter.columnId, filter.value); break
      case 'in':       query = query.whereIn(filter.columnId, filter.value); break
    }
  }

  // Total count before pagination
  const [{ count }] = await query.clone().count('* as count')
  const total = Number(count)

  // Apply sorts
  for (const sort of sorts) {
    query = query.orderBy(sort.columnId, sort.direction)
  }

  // Apply pagination
  const rows = await query
    .limit(pageSize)
    .offset(page * pageSize)

  res.json({ rows, total })
})
```

A Next.js App Router equivalent:

```ts
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { page = 0, pageSize = 50, sorts = [], filters = [] } = body

  // ... same query-building logic ...

  return NextResponse.json({ rows, total })
}
```

---

## Select filter options in server mode

In server mode you don't have the full dataset client-side, so the grid can't auto-derive dropdown options. Pass `fetchFilterOptions`:

```tsx
const fetchFilterOptions = useCallback(async (columnId: string) => {
  const res = await fetch(`/api/filter-options?column=${columnId}`)
  return res.json()  // string[]
}, [])

<DataGrid fetchFilterOptions={fetchFilterOptions} ... />
```

The function is called once per `select`-type column on mount and the results are cached. To force a re-fetch, change the function reference (e.g. increment a version in the `useCallback` deps).

---

## Avoiding stale closures

`onStateChange` is called internally without being added to effect dependency arrays (intentional, to avoid double-fetching). This means you can pass an inline function safely, but it also means the function must be stable or use refs to access the latest state if needed.

The simplest pattern is `useCallback` with explicit deps:

```tsx
const handleStateChange = useCallback(async (state: GridState) => {
  // safe to use external state here via closure
  const res = await fetch(`/api/orders?userId=${currentUserId}`, {
    method: 'POST',
    body: JSON.stringify(state),
  })
  ...
}, [currentUserId])  // re-creates when userId changes
```
