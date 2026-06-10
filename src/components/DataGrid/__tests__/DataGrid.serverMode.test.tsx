import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string; amount: number }

const cols: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount, filterType: 'number' },
]

const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}`, amount: i + 1 }))

describe('DataGrid — server mode', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders the provided data rows', () => {
    render(
      <DataGrid
        dataMode="server"
        data={makeRows(3)}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={3}
      />,
    )
    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.getByText('Row 3')).toBeInTheDocument()
  })

  it('fires onStateChange on mount with the initial state', () => {
    const onChange = vi.fn()
    render(
      <DataGrid
        dataMode="server"
        data={makeRows(5)}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={5}
        onStateChange={onChange}
      />,
    )
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].pagination.pageIndex).toBe(0)
  })

  it('fires onStateChange when the page changes', () => {
    const onChange = vi.fn()
    render(
      <DataGrid
        dataMode="server"
        data={makeRows(5)}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={50}
        pageSize={5}
        onStateChange={onChange}
      />,
    )
    onChange.mockClear()
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].pagination.pageIndex).toBe(1)
  })

  it('resets pageIndex to 0 when a filter changes', () => {
    const onChange = vi.fn()
    render(
      <DataGrid
        dataMode="server"
        data={makeRows(5)}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={50}
        pageSize={5}
        onStateChange={onChange}
        initialState={{ pagination: { pageIndex: 2, pageSize: 5 } }}
      />,
    )
    onChange.mockClear()
    const filterInput = screen.getByLabelText('Filter by Amount')
    fireEvent.change(filterInput, { target: { value: '10' } })
    act(() => { vi.runAllTimers() }) // flush debounce through React's update cycle
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].pagination.pageIndex).toBe(0)
  })

  it('shows the loading overlay when loading=true', () => {
    render(
      <DataGrid
        dataMode="server"
        data={[]}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={0}
        loading
      />,
    )
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('does not show loading overlay when loading=false', () => {
    render(
      <DataGrid
        dataMode="server"
        data={makeRows(3)}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={3}
        loading={false}
      />,
    )
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
  })

  it('shows the empty state when data is empty', () => {
    render(
      <DataGrid
        dataMode="server"
        data={[]}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={0}
        emptyState={<span>Nothing here</span>}
      />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('shows row count in pagination', () => {
    render(
      <DataGrid
        dataMode="server"
        data={makeRows(5)}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={47}
        pageSize={5}
      />,
    )
    expect(screen.getByText('1–5 of 47')).toBeInTheDocument()
  })

  it('does not re-process rows in server mode', () => {
    // Provide pre-sorted data; if the grid re-sorted it, order would change.
    const data: Row[] = [
      { id: '3', name: 'Charlie', amount: 3 },
      { id: '1', name: 'Alice', amount: 1 },
      { id: '2', name: 'Bob', amount: 2 },
    ]
    render(
      <DataGrid
        dataMode="server"
        data={data}
        columns={cols}
        getRowId={(r) => r.id}
        rowCount={3}
      />,
    )
    // Rows should appear in the order given — Charlie first, not Alice.
    const rows = screen.getAllByRole('row')
    // rows[0] = header, rows[1] = filter row, rows[2] = first data row
    const firstDataRow = rows.find((r) => within(r).queryByText('Charlie'))
    expect(firstDataRow).toBeDefined()
    // Alice should not appear before Charlie
    const allText = screen.getAllByRole('row').map((r) => r.textContent ?? '')
    const charlieIdx = allText.findIndex((t) => t.includes('Charlie'))
    const aliceIdx = allText.findIndex((t) => t.includes('Alice'))
    expect(charlieIdx).toBeLessThan(aliceIdx)
  })
})
