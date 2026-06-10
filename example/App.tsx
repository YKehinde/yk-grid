import React from 'react'
import { DataGrid } from '../src/components/DataGrid'
import type { ColumnDef } from '../src/components/DataGrid/types'
import transactions from '../transactions.json'

interface Transaction {
  id: string
  date: string
  country: string
  region: string
  amount: number
  revenue: number
  status: 'completed' | 'failed' | 'pending'
  type: 'purchase' | 'refund'
  currency: string
  partner: string
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  completed: { background: '#dcfce7', color: '#166534', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 },
  failed:    { background: '#fee2e2', color: '#991b1b', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 },
  pending:   { background: '#fef9c3', color: '#854d0e', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 },
}

const TYPE_STYLES: Record<string, React.CSSProperties> = {
  purchase: { background: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 },
  refund:   { background: '#faf5ff', color: '#7e22ce', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 },
}

const columns: ColumnDef<Transaction>[] = [
  {
    id: 'id',
    header: 'ID',
    accessor: (r) => r.id,
    sortable: true,
    filterable: true,
    width: 100,
  },
  {
    id: 'date',
    header: 'Date',
    accessor: (r) => r.date,
    sortable: true,
    filterType: 'date',
    width: 110,
  },
  {
    id: 'partner',
    header: 'Partner',
    accessor: (r) => r.partner,
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    id: 'country',
    header: 'Country',
    accessor: (r) => r.country,
    sortable: true,
    filterable: true,
    filterType: 'select',
  },
  {
    id: 'region',
    header: 'Region',
    accessor: (r) => r.region,
    sortable: true,
    filterable: true,
    filterType: 'select',
    groupable: true,
  },
  {
    id: 'type',
    header: 'Type',
    accessor: (r) => r.type,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: ['purchase', 'refund'],
    cell: (_, row) => <span style={TYPE_STYLES[row.type]}>{row.type}</span>,
    width: 100,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (r) => r.status,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: ['completed', 'failed', 'pending'],
    cell: (_, row) => <span style={STATUS_STYLES[row.status]}>{row.status}</span>,
    width: 110,
  },
  {
    id: 'currency',
    header: 'CCY',
    accessor: (r) => r.currency,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: ['GBP', 'USD', 'EUR'],
    width: 70,
  },
  {
    id: 'amount',
    header: 'Amount',
    accessor: (r) => r.amount,
    sortable: true,
    filterType: 'number',
    aggregation: 'sum',
    cell: (_, row) =>
      new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.amount),
    width: 110,
  },
  {
    id: 'revenue',
    header: 'Revenue',
    accessor: (r) => r.revenue,
    sortable: true,
    filterType: 'number',
    aggregation: 'sum',
    cell: (_, row) =>
      new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.revenue),
    width: 110,
  },
]

export default function App() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.375rem' }}>
        <h1>Transactions</h1>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#3b82f6',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '9999px',
          padding: '0.125rem 0.625rem',
          lineHeight: '1.5',
        }}>
          {transactions.length.toLocaleString()} rows
        </span>
      </div>
      <p>Client-side mode — sorting, filtering, and pagination handled locally</p>
      <DataGrid<Transaction>
        data={transactions as Transaction[]}
        columns={columns}
        getRowId={(r) => r.id}
        dataMode="client"
        pageSize={15}
        ai={{ endpoint: '/api/grid-ai', placeholder: 'e.g. "show failed refunds over £200, sorted by amount"' }}
      />
    </div>
  )
}
