import { GridState, SortEntry, FilterEntry } from '../types'

export type GridAction =
  | { type: 'SET_SORT'; sorts: SortEntry[] }
  | { type: 'SET_FILTER'; filters: FilterEntry[] }
  | { type: 'SET_GROUPING'; grouping: string[] }
  | { type: 'SET_PAGE'; pageIndex: number }
  | { type: 'SET_PAGE_SIZE'; pageSize: number }
  | { type: 'SET_COLUMN_SIZE'; columnId: string; width: number }
  | { type: 'SET_COLUMN_VISIBILITY'; columnId: string; visible: boolean }
  | { type: 'TOGGLE_SELECT'; rowId: string; mode: 'single' | 'multiple' }
  | { type: 'SELECT_ALL'; rowIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_EXPAND'; groupId: string }
  | { type: 'APPLY_AI'; partial: Partial<Pick<GridState, 'sorts' | 'filters' | 'grouping'>> }
  | { type: 'RESET' }

export function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    case 'SET_SORT':
      return { ...state, sorts: action.sorts }
    case 'SET_FILTER':
      return { ...state, filters: action.filters, pagination: { ...state.pagination, pageIndex: 0 } }
    case 'SET_GROUPING':
      return { ...state, grouping: action.grouping, pagination: { ...state.pagination, pageIndex: 0 } }
    case 'SET_PAGE':
      return { ...state, pagination: { ...state.pagination, pageIndex: action.pageIndex } }
    case 'SET_PAGE_SIZE':
      return { ...state, pagination: { ...state.pagination, pageSize: action.pageSize, pageIndex: 0 } }
    case 'SET_COLUMN_SIZE':
      return { ...state, columnSizing: { ...state.columnSizing, [action.columnId]: action.width } }
    case 'SET_COLUMN_VISIBILITY':
      return { ...state, columnVisibility: { ...state.columnVisibility, [action.columnId]: action.visible } }
    case 'TOGGLE_SELECT': {
      const next = new Set(state.selection)
      if (action.mode === 'single') {
        if (next.has(action.rowId)) {
          next.clear()
        } else {
          next.clear()
          next.add(action.rowId)
        }
      } else {
        if (next.has(action.rowId)) next.delete(action.rowId)
        else next.add(action.rowId)
      }
      return { ...state, selection: next }
    }
    case 'SELECT_ALL':
      return { ...state, selection: new Set(action.rowIds) }
    case 'CLEAR_SELECTION':
      return { ...state, selection: new Set() }
    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expanded)
      if (next.has(action.groupId)) next.delete(action.groupId)
      else next.add(action.groupId)
      return { ...state, expanded: next }
    }
    case 'APPLY_AI':
      return {
        ...state,
        ...(action.partial.sorts !== undefined && { sorts: action.partial.sorts }),
        ...(action.partial.filters !== undefined && { filters: action.partial.filters }),
        ...(action.partial.grouping !== undefined && { grouping: action.partial.grouping }),
        pagination: { ...state.pagination, pageIndex: 0 },
      }
    case 'RESET':
      return { ...state, sorts: [], filters: [], grouping: [], pagination: { ...state.pagination, pageIndex: 0 } }
    default:
      return state
  }
}
