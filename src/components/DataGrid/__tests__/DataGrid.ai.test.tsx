import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataGrid } from '../DataGrid'
import { applyCommand } from '../ai/applyCommand'
import type { ColumnDef } from '../types'

// ---------------------------------------------------------------------------
// applyCommand unit tests
// ---------------------------------------------------------------------------

describe('applyCommand', () => {
  const knownIds = new Set(['name', 'amount', 'status'])

  it('returns RESET action when command.reset is true', () => {
    const actions = applyCommand({ reset: true, explanation: 'reset' }, knownIds)
    expect(actions).toEqual([{ type: 'RESET' }])
  })

  it('returns APPLY_AI with valid columns only', () => {
    const actions = applyCommand(
      {
        filters: [
          { columnId: 'status', operator: 'eq', value: 'active' },
          { columnId: 'unknown', operator: 'eq', value: 'x' },
        ],
        sorts: [{ columnId: 'amount', direction: 'desc' }],
        explanation: 'done',
      },
      knownIds,
    )

    expect(actions).toHaveLength(1)
    expect(actions[0].type).toBe('APPLY_AI')
    const action = actions[0] as Extract<typeof actions[0], { type: 'APPLY_AI' }>
    expect(action.partial.filters).toHaveLength(1)
    expect(action.partial.filters![0].columnId).toBe('status')
    expect(action.partial.sorts).toHaveLength(1)
  })

  it('omits grouping if all column ids are unknown', () => {
    const actions = applyCommand(
      { grouping: ['nonexistent'], explanation: 'done' },
      knownIds,
    )
    const action = actions[0] as Extract<typeof actions[0], { type: 'APPLY_AI' }>
    expect(action.partial.grouping).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// AiBar integration tests
// ---------------------------------------------------------------------------

interface Row { id: string; name: string; amount: number }

const columns: ColumnDef<Row>[] = [
  { id: 'name',   header: 'Name',   accessor: (r) => r.name,   filterable: true, filterType: 'text' },
  { id: 'amount', header: 'Amount', accessor: (r) => r.amount, filterable: true, filterType: 'number' },
]

const data: Row[] = [
  { id: '1', name: 'Alice', amount: 100 },
  { id: '2', name: 'Bob',   amount: 200 },
]

describe('AiBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders when ai prop is provided', () => {
    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByLabelText('AI grid command')).toBeInTheDocument()
  })

  it('does not render when ai prop is absent', () => {
    render(
      <DataGrid data={data} columns={columns} getRowId={(r) => r.id} />,
    )
    expect(screen.queryByLabelText('AI grid command')).not.toBeInTheDocument()
  })

  it('submit button is disabled while input is empty', () => {
    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )
    expect(screen.getByLabelText('Send AI command')).toBeDisabled()
  })

  it('submit button enables when input has text', async () => {
    const user = userEvent.setup()
    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )
    await user.type(screen.getByLabelText('AI grid command'), 'show high amounts')
    expect(screen.getByLabelText('Send AI command')).not.toBeDisabled()
  })

  it('shows explanation after a successful AI response', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          filters: [{ columnId: 'amount', operator: 'gt', value: 150 }],
          explanation: 'Filtered to amounts greater than 150.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )

    await user.type(screen.getByLabelText('AI grid command'), 'amounts over 150')
    await user.click(screen.getByLabelText('Send AI command'))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Filtered to amounts greater than 150.')
    })
  })

  it('shows error message when the AI request fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    )

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )

    await user.type(screen.getByLabelText('AI grid command'), 'do something')
    await user.click(screen.getByLabelText('Send AI command'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('clears the input after a successful response', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ reset: true, explanation: 'Reset.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )

    const input = screen.getByLabelText('AI grid command')
    await user.type(input, 'reset everything')
    await user.click(screen.getByLabelText('Send AI command'))

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('uses a custom placeholder', () => {
    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai', placeholder: 'Custom hint…' }}
      />,
    )
    expect(screen.getByPlaceholderText('Custom hint…')).toBeInTheDocument()
  })

  it('sends the correct payload to the endpoint', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ explanation: 'Done.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    render(
      <DataGrid
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        ai={{ endpoint: '/api/grid-ai' }}
      />,
    )

    await user.type(screen.getByLabelText('AI grid command'), 'test query')
    await user.click(screen.getByLabelText('Send AI command'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('/api/grid-ai')
    expect((init as RequestInit).method).toBe('POST')

    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.prompt).toBe('test query')
    expect(body.columns).toHaveLength(2)
    expect(body.columns[0]).toMatchObject({ id: 'name', header: 'Name' })
  })
})
