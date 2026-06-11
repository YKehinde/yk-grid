import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string; status: string; amount: number }

const data: Row[] = [
  { id: '1', name: 'Alice', status: 'active',   amount: 100 },
  { id: '2', name: 'Bob',   status: 'inactive', amount: 200 },
  { id: '3', name: 'Carol', status: 'active',   amount: 300 },
]

const columns: ColumnDef<Row>[] = [
  { id: 'name',   header: 'Name',   accessor: (r) => r.name,   filterable: true, filterType: 'text' },
  { id: 'status', header: 'Status', accessor: (r) => r.status, filterable: true, filterType: 'select' },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount, filterable: true, filterType: 'number' },
]

function renderGrid() {
  return render(
    <DataGrid<Row>
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      dataMode="client"
      pageSize={20}
    />,
  )
}

function getFilterBtn(name: string) {
  return screen.getByRole('button', { name: `Filter ${name}` })
}

describe('DataGrid — filter panel', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not render filter buttons for columns by default', () => {
    render(
      <DataGrid<Row>
        data={data}
        columns={[
          { id: 'name', header: 'Name', accessor: (r) => r.name, filterType: 'text' },
          { id: 'status', header: 'Status', accessor: (r) => r.status, filterType: 'select' },
        ]}
        getRowId={(r) => r.id}
        dataMode="client"
      />,
    )

    expect(screen.queryByRole('button', { name: 'Filter Name' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Filter Status' })).toBeNull()
  })

  it('renders a filter button for each filterable column', () => {
    renderGrid()
    expect(screen.getByRole('button', { name: 'Filter Name' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Filter Status' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Filter Amount' })).toBeDefined()
  })

  it('opens the filter panel when the filter button is clicked', () => {
    renderGrid()
    fireEvent.click(getFilterBtn('Name'))
    expect(screen.getByRole('dialog', { name: 'Filter Name' })).toBeDefined()
  })

  it('closes the filter panel when the same button is clicked again', () => {
    renderGrid()
    fireEvent.click(getFilterBtn('Name'))
    expect(screen.getByRole('dialog', { name: 'Filter Name' })).toBeDefined()
    fireEvent.click(getFilterBtn('Name'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('switches to a different column panel when a second filter button is clicked', () => {
    renderGrid()
    fireEvent.click(getFilterBtn('Name'))
    expect(screen.getByRole('dialog', { name: 'Filter Name' })).toBeDefined()
    fireEvent.click(getFilterBtn('Status'))
    expect(screen.queryByRole('dialog', { name: 'Filter Name' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Filter Status' })).toBeDefined()
  })

  it('typing in the text filter panel filters the rows', () => {
    const { container } = renderGrid()
    fireEvent.click(getFilterBtn('Name'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Alice' } })
    act(() => { vi.runAllTimers() })
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0].textContent).toContain('Alice')
  })

  it('number filter with operator filters correctly', () => {
    const { container } = renderGrid()
    fireEvent.click(getFilterBtn('Amount'))
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '150' } })
    act(() => { vi.runAllTimers() })
    // Default operator is 'eq'; no row has amount === 150 so shows empty state
    expect(container.textContent).toContain('No data')
  })

  it('shows empty state when the filter matches nothing', () => {
    renderGrid()
    fireEvent.click(getFilterBtn('Name'))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'zzznomatch' } })
    act(() => { vi.runAllTimers() })
    expect(screen.getByText('No data')).toBeDefined()
  })

  it('select panel shows unique values for the column', () => {
    renderGrid()
    fireEvent.click(getFilterBtn('Status'))
    expect(screen.getByLabelText('active')).toBeDefined()
    expect(screen.getByLabelText('inactive')).toBeDefined()
  })
})
