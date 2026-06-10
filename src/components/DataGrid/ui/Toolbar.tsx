// Stub — selection count, export, column menu, and toolbarActions slot added in phases 7–8.
import React from 'react'

interface Props {
  children?: React.ReactNode
}

export function Toolbar({ children }: Props) {
  return <div className="grid-toolbar">{children}</div>
}
