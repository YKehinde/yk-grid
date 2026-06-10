import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string }

const data: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
]

const columns: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name, filterable: false },
]

const getRowId = (r: Row) => r.id

function renderGrid(props: Partial<React.ComponentProps<typeof DataGrid<Row>>> = {}) {
  return render(
    <DataGrid<Row>
      data={data}
      columns={columns}
      getRowId={getRowId}
      dataMode="client"
      {...props}
    />,
  )
}

describe('DataGrid — toolbar', () => {
  it('renders no toolbar when enableCsvExport is false and no toolbarActions and nothing selected', () => {
    renderGrid()
    expect(screen.queryByRole('toolbar')).toBeNull()
  })

  it('renders toolbar when enableCsvExport is true', () => {
    renderGrid({ enableCsvExport: true })
    expect(screen.getByRole('toolbar')).toBeDefined()
  })

  it('renders Export CSV button when enableCsvExport is true', () => {
    renderGrid({ enableCsvExport: true })
    expect(screen.getByRole('button', { name: 'Export to CSV' })).toBeDefined()
  })

  it('renders selection count when rows are selected', () => {
    renderGrid({ selectionMode: 'multiple' })
    const [, firstRowCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(firstRowCheckbox)
    expect(screen.getByText(/1 row selected/)).toBeDefined()
  })

  it('renders correct plural for multiple selected rows', () => {
    renderGrid({ selectionMode: 'multiple' })
    const [headerCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(headerCheckbox) // select all
    expect(screen.getByText(/2 rows selected/)).toBeDefined()
  })

  it('clears selection when the × button is clicked', () => {
    renderGrid({ selectionMode: 'multiple' })
    const [, firstRowCheckbox] = screen.getAllByRole('checkbox')
    fireEvent.click(firstRowCheckbox)
    const clearBtn = screen.getByRole('button', { name: 'Clear selection' })
    fireEvent.click(clearBtn)
    expect(screen.queryByText(/row selected/)).toBeNull()
  })

  it('renders custom toolbarActions slot', () => {
    renderGrid({
      toolbarActions: () => <button>Custom Action</button>,
    })
    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeDefined()
  })

  it('passes correct context to toolbarActions', () => {
    const spy = vi.fn(() => null)
    renderGrid({
      selectionMode: 'multiple',
      toolbarActions: spy,
    })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedRows: expect.any(Array),
        selectedIds: expect.any(Array),
        processedRows: expect.any(Array),
        gridState: expect.any(Object),
        clearSelection: expect.any(Function),
      }),
    )
  })

  describe('CSV export', () => {
    beforeEach(() => {
      // triggerCsvDownload creates a blob URL and clicks an anchor — mock it
      URL.createObjectURL = vi.fn(() => 'blob:mock')
      URL.revokeObjectURL = vi.fn()
    })

    it('calls URL.createObjectURL when Export CSV is clicked', () => {
      renderGrid({ enableCsvExport: true })
      fireEvent.click(screen.getByRole('button', { name: 'Export to CSV' }))
      expect(URL.createObjectURL).toHaveBeenCalled()
    })
  })
})
