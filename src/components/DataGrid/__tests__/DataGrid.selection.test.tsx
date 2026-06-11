import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string }

const data: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
]

const columns: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
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

describe('DataGrid — selection', () => {
  it('renders no checkboxes when selectionMode is none (default)', () => {
    renderGrid()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('renders a checkbox per row plus one header checkbox in multiple mode', () => {
    renderGrid({ selectionMode: 'multiple' })
    // 3 rows + 1 header = 4 checkboxes
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
  })

  it('uses a fixed-width selection column', () => {
    const { container } = renderGrid({ selectionMode: 'multiple' })
    const selectionCol = container.querySelector('colgroup col')
    expect(selectionCol).toBeInstanceOf(HTMLTableColElement)
    expect((selectionCol as HTMLTableColElement).style.width).toBe('40px')
    expect((selectionCol as HTMLTableColElement).style.minWidth).toBe('40px')
    expect((selectionCol as HTMLTableColElement).style.maxWidth).toBe('40px')
  })

  it('renders a single header checkbox in single mode', () => {
    renderGrid({ selectionMode: 'single' })
    // single mode still has a header checkbox + 3 row checkboxes
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
  })

  it('toggles a row on when its checkbox is clicked', () => {
    renderGrid({ selectionMode: 'multiple' })
    const checkboxes = screen.getAllByRole('checkbox')
    // checkboxes[0] = header, checkboxes[1] = row 1
    fireEvent.click(checkboxes[1])
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true)
  })

  it('deselects a row when clicked again', () => {
    renderGrid({ selectionMode: 'multiple' })
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[1])
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false)
  })

  it('in single mode, selecting a second row deselects the first', () => {
    renderGrid({ selectionMode: 'single' })
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // select row 1
    fireEvent.click(checkboxes[2]) // select row 2
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false)
    expect((checkboxes[2] as HTMLInputElement).checked).toBe(true)
  })

  describe('select-all header checkbox', () => {
    it('selects all rows on the page when clicked', () => {
      renderGrid({ selectionMode: 'multiple' })
      const [headerCheckbox] = screen.getAllByRole('checkbox')
      fireEvent.click(headerCheckbox)
      const all = screen.getAllByRole('checkbox')
      // rows 1–3 should all be checked
      expect(all.slice(1).every((cb) => (cb as HTMLInputElement).checked)).toBe(true)
    })

    it('deselects all rows when all are selected and header is clicked', () => {
      renderGrid({ selectionMode: 'multiple' })
      const [headerCheckbox] = screen.getAllByRole('checkbox')
      fireEvent.click(headerCheckbox) // select all
      fireEvent.click(headerCheckbox) // deselect all
      const all = screen.getAllByRole('checkbox')
      expect(all.slice(1).every((cb) => !(cb as HTMLInputElement).checked)).toBe(true)
    })

    it('header checkbox is indeterminate when some (not all) rows are selected', () => {
      renderGrid({ selectionMode: 'multiple' })
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1]) // select only row 1
      const headerInput = checkboxes[0] as HTMLInputElement
      expect(headerInput.indeterminate).toBe(true)
      expect(headerInput.checked).toBe(false)
    })
  })

  describe('onSelectionChange callback', () => {
    it('fires with the selected rows and ids when a row is toggled', async () => {
      const onSelectionChange = vi.fn()
      renderGrid({ selectionMode: 'multiple', onSelectionChange })
      const checkboxes = screen.getAllByRole('checkbox')
      await act(async () => { fireEvent.click(checkboxes[1]) })
      expect(onSelectionChange).toHaveBeenCalledWith(
        [{ id: '1', name: 'Alice' }],
        expect.arrayContaining(['1']),
      )
    })

    it('fires with an empty array after clear', async () => {
      const onSelectionChange = vi.fn()
      renderGrid({ selectionMode: 'multiple', onSelectionChange })
      const checkboxes = screen.getAllByRole('checkbox')
      await act(async () => { fireEvent.click(checkboxes[1]) })
      await act(async () => { fireEvent.click(checkboxes[1]) }) // deselect
      const lastCall = onSelectionChange.mock.calls.at(-1)!
      expect(lastCall[0]).toEqual([])
    })
  })

  it('sets aria-selected on selected rows', () => {
    renderGrid({ selectionMode: 'multiple' })
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    // getAllByRole('row') includes: header row, filter row, then data rows.
    // Find data rows by the presence of aria-selected.
    const dataRows = screen.getAllByRole('row').filter((r) => r.hasAttribute('aria-selected'))
    expect(dataRows[0].getAttribute('aria-selected')).toBe('true')  // Alice
    expect(dataRows[1].getAttribute('aria-selected')).toBe('false') // Bob
  })
})
