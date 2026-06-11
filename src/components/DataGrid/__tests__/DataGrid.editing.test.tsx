import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string; amount: number }

const data: Row[] = [
  { id: '1', name: 'Alice', amount: 100 },
  { id: '2', name: 'Bob',   amount: 200 },
]

const columns: ColumnDef<Row>[] = [
  { id: 'name',   header: 'Name',   accessor: (r) => r.name,   editable: true },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount, editable: true, filterType: 'number' },
  { id: 'id',     header: 'ID',     accessor: (r) => r.id },
]

function getDataRows(container: HTMLElement) {
  return container.querySelectorAll('tbody tr')
}

function renderGrid(onCellEdit = vi.fn()) {
  const utils = render(
    <DataGrid<Row>
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      dataMode="client"
      onCellEdit={onCellEdit}
    />,
  )
  return { ...utils, onCellEdit }
}

describe('Inline cell editing', () => {
  describe('activating edit mode', () => {
    it('double-clicking an editable cell shows an input', () => {
      const { container } = renderGrid()
      const firstRow = getDataRows(container)[0]
      const nameCell = firstRow.querySelectorAll('td')[0]
      fireEvent.doubleClick(nameCell)
      expect(screen.getByRole('textbox', { name: 'Edit Name' })).toBeDefined()
    })

    it('input is pre-filled with the current cell value', () => {
      const { container } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' }) as HTMLInputElement
      expect(input.value).toBe('Alice')
    })

    it('uses a number input for number columns', () => {
      const { container } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[1])
      const input = screen.getByRole('spinbutton', { name: 'Edit Amount' }) as HTMLInputElement
      expect(input.value).toBe('100')
    })

    it('does not show input for non-editable columns', () => {
      const { container } = renderGrid()
      const firstRow = getDataRows(container)[0]
      const idCell = firstRow.querySelectorAll('td')[2]
      fireEvent.doubleClick(idCell)
      expect(screen.queryByRole('textbox')).toBeNull()
    })

    it('only one cell is editable at a time — opening a second cell closes the first', () => {
      const { container } = renderGrid()
      const rows = getDataRows(container)
      fireEvent.doubleClick(rows[0].querySelectorAll('td')[0])
      expect(screen.getAllByRole('textbox')).toHaveLength(1)
      fireEvent.doubleClick(rows[1].querySelectorAll('td')[0])
      expect(screen.getAllByRole('textbox')).toHaveLength(1)
    })
  })

  describe('committing', () => {
    it('Enter key commits and hides the input', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' })
      fireEvent.change(input, { target: { value: 'Alice Updated' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(screen.queryByRole('textbox')).toBeNull()
      expect(onCellEdit).toHaveBeenCalledWith('Alice Updated', data[0], columns[0])
    })

    it('Tab key commits', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' })
      fireEvent.change(input, { target: { value: 'Alice Tab' } })
      fireEvent.keyDown(input, { key: 'Tab' })
      expect(onCellEdit).toHaveBeenCalledWith('Alice Tab', data[0], columns[0])
    })

    it('blur commits', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' })
      fireEvent.change(input, { target: { value: 'Alice Blur' } })
      fireEvent.blur(input)
      expect(onCellEdit).toHaveBeenCalledWith('Alice Blur', data[0], columns[0])
    })

    it('commits a number value as a number type', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[1])
      const input = screen.getByRole('spinbutton', { name: 'Edit Amount' })
      fireEvent.change(input, { target: { value: '250' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onCellEdit).toHaveBeenCalledWith(250, data[0], columns[1])
    })

    it('does not call onCellEdit more than once when Enter is pressed (blur fires after Enter)', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' })
      fireEvent.change(input, { target: { value: 'Once' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      fireEvent.blur(input)
      expect(onCellEdit).toHaveBeenCalledTimes(1)
    })
  })

  describe('cancelling', () => {
    it('Escape key cancels and hides the input without calling onCellEdit', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' })
      fireEvent.change(input, { target: { value: 'Should not save' } })
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(screen.queryByRole('textbox')).toBeNull()
      expect(onCellEdit).not.toHaveBeenCalled()
    })

    it('does not call onCellEdit on blur after Escape', () => {
      const { container, onCellEdit } = renderGrid()
      const firstRow = getDataRows(container)[0]
      fireEvent.doubleClick(firstRow.querySelectorAll('td')[0])
      const input = screen.getByRole('textbox', { name: 'Edit Name' })
      fireEvent.keyDown(input, { key: 'Escape' })
      fireEvent.blur(input)
      expect(onCellEdit).not.toHaveBeenCalled()
    })
  })
})
