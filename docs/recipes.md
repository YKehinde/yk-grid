---
title: Recipes
render_with_liquid: false
---

{% raw %}

# Recipes

Real-world patterns for common scenarios.

---

## Transactions dashboard (client mode, full feature set)

```tsx
import React, { useRef } from 'react'
import { DataGrid, GridRef } from 'yk-grid'
import type { ColumnDef } from 'yk-grid'

interface Transaction {
  id: string
  date: string
  partner: string
  country: string
  amount: number
  status: 'completed' | 'failed' | 'pending'
  type: 'purchase' | 'refund'
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  completed: { background: '#dcfce7', color: '#166534', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem' },
  failed:    { background: '#fee2e2', color: '#991b1b', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem' },
  pending:   { background: '#fef9c3', color: '#854d0e', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem' },
}

const columns: ColumnDef<Transaction>[] = [
  { id: 'date',    header: 'Date',    accessor: r => r.date,    sortable: true, filterable: true, filterType: 'date', width: 120 },
  { id: 'partner', header: 'Partner', accessor: r => r.partner, sortable: true, filterable: true },
  { id: 'country', header: 'Country', accessor: r => r.country, sortable: true, filterable: true, filterType: 'select', groupable: true },
  { id: 'type',    header: 'Type',    accessor: r => r.type,    sortable: true, filterable: true, filterType: 'select', filterOptions: ['purchase', 'refund'], width: 100 },
  { id: 'status',  header: 'Status',  accessor: r => r.status,  sortable: true, filterable: true, filterType: 'select', filterOptions: ['completed', 'failed', 'pending'],
    cell: (_, row) => <span style={STATUS_STYLE[row.status]}>{row.status}</span>,
    exportValue: r => r.status,
    width: 110,
  },
  { id: 'amount',  header: 'Amount',  accessor: r => r.amount,  sortable: true, filterable: true, filterType: 'number', aggregation: 'sum',
    cell: (_, row) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(row.amount),
    exportValue: r => r.amount,
    width: 120,
  },
]

export default function TransactionsDashboard({ data }: { data: Transaction[] }) {
  const ref = useRef<GridRef<Transaction>>(null)

  return (
    <DataGrid<Transaction>
      ref={ref}
      data={data}
      columns={columns}
      getRowId={r => r.id}
      dataMode="client"
      pageSize={50}
      height={600}
      selectionMode="multiple"
      selectAllScope="filtered"
      enableColumnResize
      enableColumnVisibility
      enableCsvExport
      csvFilename="transactions.csv"
      ai={{ endpoint: '/api/grid-ai', placeholder: 'e.g. "failed refunds over £500 last month"' }}
      toolbarActions={({ selectedRows, clearSelection }) => (
        selectedRows.length > 0 ? (
          <button onClick={() => { flagForReview(selectedRows); clearSelection() }}>
            Flag for review ({selectedRows.length})
          </button>
        ) : null
      )}
    />
  )
}
```

---

## Server-side with debounced fetch and loading state

```tsx
import { useState, useCallback, useRef } from 'react'
import { DataGrid } from 'yk-grid'
import type { GridState } from 'yk-grid'

export default function ServerGrid() {
  const [data, setData]         = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading]   = useState(false)
  const fetchTimeout            = useRef<ReturnType<typeof setTimeout>>()

  const handleStateChange = useCallback((state: GridState) => {
    clearTimeout(fetchTimeout.current)
    fetchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/rows', {
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
    }, 200)  // 200 ms debounce prevents double-fetch on rapid changes
  }, [])

  return (
    <DataGrid
      data={data}
      rowCount={rowCount}
      columns={columns}
      getRowId={r => r.id}
      dataMode="server"
      loading={loading}
      onStateChange={handleStateChange}
    />
  )
}
```

---

## Pre-filtered view from URL params

```tsx
import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { DataGrid } from 'yk-grid'

export default function UsersPage() {
  const [searchParams] = useSearchParams()

  const initialState = useMemo(() => {
    const status = searchParams.get('status')
    return status
      ? { filters: [{ columnId: 'status', operator: 'eq' as const, value: status }] }
      : {}
  }, [])  // intentionally empty deps — only read on mount

  return <DataGrid initialState={initialState} ... />
}
```

---

## Syncing state back to URL

```tsx
import { useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DataGrid, GridRef } from 'yk-grid'
import type { GridState } from 'yk-grid'

export default function OrdersPage() {
  const ref = useRef<GridRef<Order>>(null)
  const navigate = useNavigate()

  const handleStateChange = useCallback((state: GridState) => {
    const params = new URLSearchParams()
    if (state.sorts.length)   params.set('sorts',   JSON.stringify(state.sorts))
    if (state.filters.length) params.set('filters', JSON.stringify(state.filters))
    navigate({ search: params.toString() }, { replace: true })

    // also fetch server data here if needed
  }, [navigate])

  return <DataGrid ref={ref} onStateChange={handleStateChange} ... />
}
```

---

## Custom cell with click handler

```tsx
const columns: ColumnDef<Order>[] = [
  {
    id: 'orderId',
    header: 'Order',
    accessor: r => r.orderId,
    cell: (_, row) => (
      <button
        className="link-button"
        onClick={(e) => {
          e.stopPropagation()  // prevent onRowClick if set
          openOrderDetail(row.orderId)
        }}
      >
        {row.orderId}
      </button>
    ),
  },
]
```

---

## Column with conditional formatting

```tsx
{
  id: 'margin',
  header: 'Margin %',
  accessor: r => r.margin,
  sortable: true,
  filterType: 'number',
  cell: (_, row) => (
    <span style={{ color: row.margin < 0 ? '#dc2626' : row.margin > 20 ? '#16a34a' : undefined }}>
      {row.margin.toFixed(1)}%
    </span>
  ),
}
```

---

## Refreshing server-fetched filter options

```tsx
const [optionsVersion, setOptionsVersion] = useState(0)

const fetchFilterOptions = useCallback(async (columnId: string) => {
  const res = await fetch(`/api/filter-options?col=${columnId}&v=${optionsVersion}`)
  return res.json()
}, [optionsVersion])  // change version → function reference changes → re-fetch

<DataGrid
  fetchFilterOptions={fetchFilterOptions}
  ...
/>

// later, to refresh (e.g. after a data mutation):
<button onClick={() => setOptionsVersion(v => v + 1)}>Refresh options</button>
```

---

## Exporting selected rows from outside the grid

```tsx
const ref = useRef<GridRef<Report>>(null)

return (
  <>
    <header>
      <button onClick={() => ref.current?.exportCsv({ selectedOnly: true })}>
        Export selected
      </button>
      <button onClick={() => ref.current?.exportCsv()}>
        Export all
      </button>
    </header>
    <DataGrid<Report>
      ref={ref}
      selectionMode="multiple"
      enableCsvExport={false}   // hide built-in button, use our own instead
      ...
    />
  </>
)
```

---

## Large dataset with virtual scrolling and grouping

```tsx
<DataGrid<Log>
  data={logs}               // 50 000 rows
  columns={columns}
  getRowId={r => r.id}
  dataMode="client"
  pageSize={1000}           // keep pagination pages large
  height={700}
  estimatedRowHeight={36}
  initialState={{
    grouping: ['severity'],
    sorts: [{ columnId: 'timestamp', direction: 'desc' }],
  }}
/>
```

{% endraw %}
