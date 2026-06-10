// Stub — implemented in phase 10.
import { AiCommandSchema, AiCommand } from './schema'
import { ColumnDef, GridState } from '../types'

export async function fetchAiCommand<T>(
  endpoint: string,
  prompt: string,
  columns: ColumnDef<T>[],
  currentState: GridState,
  signal?: AbortSignal,
): Promise<AiCommand> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      columns: columns.map((c) => ({ id: c.id, header: c.header, filterType: c.filterType })),
      currentState,
    }),
    signal,
  })

  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)

  const json = await res.json()
  return AiCommandSchema.parse(json)
}
