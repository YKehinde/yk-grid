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

// Returns <tr> elements from tbody only.
function getDataRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('tbody tr'))
}

// Returns all <td> elements from tbody.
function getDataCells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('tbody td'))
}

describe('Row click handlers', () => {
  describe('when onRowClick is absent', () => {
    it('row has no role attribute', () => {
      const { container } = renderGrid()
      const [first] = getDataRows(container)
      expect(first.getAttribute('role')).toBeNull()
    })

    it('row has no tabIndex', () => {
      const { container } = renderGrid()
      const [first] = getDataRows(container)
      expect(first.getAttribute('tabindex')).toBeNull()
    })

    it('row has no cursor:pointer inline style', () => {
      const { container } = renderGrid()
      const [first] = getDataRows(container)
      expect(first.style.cursor).not.toBe('pointer')
    })
  })

  describe('when onRowClick is provided', () => {
    it('row has role="button"', () => {
      const { container } = renderGrid({ onRowClick: vi.fn() })
      const [first] = getDataRows(container)
      expect(first.getAttribute('role')).toBe('button')
    })

    it('row has tabIndex={0}', () => {
      const { container } = renderGrid({ onRowClick: vi.fn() })
      const [first] = getDataRows(container)
      expect(first.getAttribute('tabindex')).toBe('0')
    })

    it('row has cursor:pointer inline style', () => {
      const { container } = renderGrid({ onRowClick: vi.fn() })
      const [first] = getDataRows(container)
      expect(first.style.cursor).toBe('pointer')
    })

    it('fires onRowClick with the correct row on click', () => {
      const handler = vi.fn()
      const { container } = renderGrid({ onRowClick: handler })
      const [first] = getDataRows(container)
      fireEvent.click(first)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        data[0],
        expect.any(Number),
        expect.any(Object),
      )
    })

    it('fires onRowClick on Enter key', () => {
      const handler = vi.fn()
      const { container } = renderGrid({ onRowClick: handler })
      const [first] = getDataRows(container)
      fireEvent.keyDown(first, { key: 'Enter' })
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('fires onRowClick on Space key', () => {
      const handler = vi.fn()
      const { container } = renderGrid({ onRowClick: handler })
      const [first] = getDataRows(container)
      fireEvent.keyDown(first, { key: ' ' })
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not fire onRowClick on other keys', () => {
      const handler = vi.fn()
      const { container } = renderGrid({ onRowClick: handler })
      const [first] = getDataRows(container)
      fireEvent.keyDown(first, { key: 'Tab' })
      fireEvent.keyDown(first, { key: 'Escape' })
      expect(handler).not.toHaveBeenCalled()
    })
  })
})

describe('Cell click handlers', () => {
  describe('when onCellClick is absent', () => {
    it('cells have no cursor:pointer style', () => {
      const { container } = renderGrid()
      const cells = getDataCells(container)
      expect(cells.length).toBeGreaterThan(0)
      expect(cells.every((c) => c.style.cursor !== 'pointer')).toBe(true)
    })
  })

  describe('when onCellClick is provided', () => {
    it('fires onCellClick with value, row, and column on click', () => {
      const handler = vi.fn()
      const { container } = renderGrid({ onCellClick: handler })
      // First cell in first row = Alice's Name cell
      const [firstCell] = getDataCells(container)
      fireEvent.click(firstCell)
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        'Alice',
        data[0],
        expect.objectContaining({ id: 'name' }),
        expect.any(Object),
      )
    })

    it('cell click does NOT propagate to row handler (stopPropagation)', () => {
      const rowHandler = vi.fn()
      const cellHandler = vi.fn()
      const { container } = renderGrid({ onRowClick: rowHandler, onCellClick: cellHandler })
      const [firstCell] = getDataCells(container)
      fireEvent.click(firstCell)
      expect(cellHandler).toHaveBeenCalledTimes(1)
      expect(rowHandler).not.toHaveBeenCalled()
    })

    it('clicking the row directly (not a cell) still fires onRowClick', () => {
      const rowHandler = vi.fn()
      renderGrid({ onRowClick: rowHandler })
      // Use screen to find the row by its accessible role when interactive
      const [firstBtn] = screen.getAllByRole('button')
      fireEvent.click(firstBtn)
      expect(rowHandler).toHaveBeenCalledTimes(1)
    })

    it('second row click fires onRowClick with the second row data', () => {
      const handler = vi.fn()
      const { container } = renderGrid({ onRowClick: handler })
      const rows = getDataRows(container)
      fireEvent.click(rows[1])
      expect(handler).toHaveBeenCalledWith(
        data[1],
        expect.any(Number),
        expect.any(Object),
      )
    })
  })
})
