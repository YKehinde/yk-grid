import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { DataGrid } from '../DataGrid'
import { ColumnDef } from '../types'

interface Row { id: string; name: string }

const columns: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name },
]

function makeRows(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }))
}

describe('DataGrid — virtual scrolling', () => {
  beforeEach(() => {
    // Provide a non-zero scrollHeight so useVirtualizer can measure.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() { return 600 },
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders a header table and a separate body scroll container when height is set', () => {
    const { container } = render(
      <DataGrid<Row>
        data={makeRows(100)}
        columns={columns}
        getRowId={(r) => r.id}
        dataMode="client"
        height={300}
        pageSize={100}
      />,
    )
    // Two-table layout: first table is the header, inside vsOuter.
    const tables = container.querySelectorAll('table')
    expect(tables.length).toBeGreaterThanOrEqual(2)
    // The body scroll div has overflow-y: auto set inline.
    const scrollDiv = container.querySelector('[style*="overflow-y"]')
    expect(scrollDiv).not.toBeNull()
  })

  it('keeps virtual header and body at the same horizontal width', () => {
    const wideColumns: ColumnDef<Row>[] = [
      { id: 'name', header: 'Name', accessor: (r) => r.name, width: 320 },
      { id: 'copy', header: 'Copy', accessor: (r) => r.name, width: 280 },
    ]

    const { container } = render(
      <DataGrid<Row>
        data={makeRows(100)}
        columns={wideColumns}
        getRowId={(r) => r.id}
        dataMode="client"
        height={300}
        pageSize={100}
      />,
    )

    const tables = container.querySelectorAll('table')
    const scrollDiv = container.querySelector('[style*="overflow-y"]') as HTMLDivElement

    expect(tables[0].style.minWidth).toBe('600px')
    expect(tables[1].style.minWidth).toBe('600px')
    expect(scrollDiv.style.minWidth).toBe('600px')
  })

  it('renders a single table (no virtual scroll) when height is not set', () => {
    const { container } = render(
      <DataGrid<Row>
        data={makeRows(20)}
        columns={columns}
        getRowId={(r) => r.id}
        dataMode="client"
        pageSize={20}
      />,
    )
    const tables = container.querySelectorAll('table')
    expect(tables).toHaveLength(1)
  })

  it('does not render all rows when virtual scroll is active (renders a subset)', () => {
    const { container } = render(
      <DataGrid<Row>
        data={makeRows(500)}
        columns={columns}
        getRowId={(r) => r.id}
        dataMode="client"
        height={300}
        pageSize={500}
        estimatedRowHeight={41}
      />,
    )
    // Virtual scroll should render far fewer than 500 rows.
    const bodyRows = container.querySelectorAll('tbody tr')
    // Some rows will be spacer rows; actual data rows + spacer rows should be < 500.
    expect(bodyRows.length).toBeLessThan(500)
  })
})
