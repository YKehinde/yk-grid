import { useReducer, useCallback } from 'react'
import { GridState, GridRef } from '../types'
import { gridReducer, GridAction } from './gridReducer'

const DEFAULT_STATE: GridState = {
  sorts: [],
  filters: [],
  grouping: [],
  expanded: new Set(),
  selection: new Set(),
  pagination: { pageIndex: 0, pageSize: 20 },
  columnSizing: {},
  columnVisibility: {},
}

export function buildInitialState(
  initial: Partial<GridState> | undefined,
  pageSize: number,
): GridState {
  return {
    ...DEFAULT_STATE,
    ...initial,
    pagination: {
      pageIndex: 0,
      pageSize,
      ...initial?.pagination,
    },
  }
}

export function useGridState(initialState: GridState) {
  const [state, dispatch] = useReducer(gridReducer, initialState)

  const dispatchAction = useCallback((action: GridAction) => {
    dispatch(action)
  }, [])

  return { state, dispatch: dispatchAction }
}

export type { GridRef }
