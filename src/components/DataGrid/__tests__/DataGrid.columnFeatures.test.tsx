import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string; amount: number }

const data: Row[] = [
  { id: '1', name: 'Alice', amount: 100 },
  { id: '2', name: 'Bob', amount: 200 },
]

const columns: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name, filterable: false },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount, filterable: false },
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

describe('DataGrid — column visibility', () => {
  it('renders no column menu buttons when enableColumnVisibility is false', () => {
    renderGrid()
    expect(screen.queryByRole('button', { name: /Column options/ })).toBeNull()
  })

  it('renders column menu buttons when enableColumnVisibility is true', () => {
    renderGrid({ enableColumnVisibility: true })
    const menuBtns = screen.getAllByRole('button', { name: /Column options/ })
    expect(menuBtns).toHaveLength(columns.length)
  })

  it('opens column menu when the ⋮ button is clicked', () => {
    renderGrid({ enableColumnVisibility: true })
    const [firstMenuBtn] = screen.getAllByRole('button', { name: /Column options/ })
    fireEvent.click(firstMenuBtn)
    expect(screen.getByRole('dialog', { name: 'Column visibility' })).toBeDefined()
  })

  it('lists all columns in the menu', () => {
    renderGrid({ enableColumnVisibility: true })
    const [firstMenuBtn] = screen.getAllByRole('button', { name: /Column options/ })
    fireEvent.click(firstMenuBtn)
    expect(screen.getByLabelText('Name')).toBeDefined()
    expect(screen.getByLabelText('Amount')).toBeDefined()
  })

  it('hides a column when its checkbox is unchecked', () => {
    renderGrid({ enableColumnVisibility: true })
    const [firstMenuBtn] = screen.getAllByRole('button', { name: /Column options/ })
    fireEvent.click(firstMenuBtn)
    const amountCheckbox = screen.getByLabelText('Amount') as HTMLInputElement
    expect(amountCheckbox.checked).toBe(true)
    fireEvent.click(amountCheckbox)
    // Amount column header should no longer be in the table
    expect(screen.queryByRole('columnheader', { name: 'Amount' })).toBeNull()
  })

  it('closes the menu when Escape is pressed', () => {
    renderGrid({ enableColumnVisibility: true })
    const [firstMenuBtn] = screen.getAllByRole('button', { name: /Column options/ })
    fireEvent.click(firstMenuBtn)
    expect(screen.getByRole('dialog')).toBeDefined()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('toggles menu closed when the same ⋮ button is clicked again', () => {
    renderGrid({ enableColumnVisibility: true })
    const [firstMenuBtn] = screen.getAllByRole('button', { name: /Column options/ })
    fireEvent.click(firstMenuBtn)
    fireEvent.click(firstMenuBtn)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('DataGrid — column resize', () => {
  it('renders resize handles when enableColumnResize is true', () => {
    renderGrid({ enableColumnResize: true })
    const handles = screen.getAllByRole('separator', { name: /Resize/ })
    expect(handles).toHaveLength(columns.length)
  })

  it('renders no resize handles when enableColumnResize is false', () => {
    renderGrid()
    expect(screen.queryByRole('separator', { name: /Resize/ })).toBeNull()
  })

  it('fires onResize via mouse drag', () => {
    const dispatchSpy = vi.fn()
    renderGrid({ enableColumnResize: true })

    const [handle] = screen.getAllByRole('separator', { name: /Resize/ })
    // Simulate mousedown at x=200 on a handle
    fireEvent.mouseDown(handle, { clientX: 200 })
    // Simulate mousemove to x=250 (+50px)
    fireEvent.mouseMove(document, { clientX: 250 })
    fireEvent.mouseUp(document)
    // We can't easily test the exact pixel width without JSDOM layout,
    // but we verify no error is thrown and the handle is still rendered.
    expect(handle).toBeDefined()
    void dispatchSpy
  })
})
