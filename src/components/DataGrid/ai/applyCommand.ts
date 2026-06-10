// Stub — implemented in phase 10.
import { AiCommand } from './schema'
import { GridAction } from '../state/gridReducer'
import { GridState } from '../types'

type AiPartial = Partial<Pick<GridState, 'sorts' | 'filters' | 'grouping'>>

export function applyCommand(
  command: AiCommand,
  knownColumnIds: Set<string>,
): GridAction[] {
  if (command.reset) {
    return [{ type: 'RESET' }]
  }

  const partial: AiPartial = {}

  if (command.filters) {
    partial.filters = command.filters.filter((f) => knownColumnIds.has(f.columnId))
  }
  if (command.sorts) {
    partial.sorts = command.sorts.filter((s) => knownColumnIds.has(s.columnId))
  }
  if (command.grouping) {
    partial.grouping = command.grouping.filter((id) => knownColumnIds.has(id))
  }

  return [{ type: 'APPLY_AI', partial }]
}
