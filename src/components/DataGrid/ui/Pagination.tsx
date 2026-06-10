// Stub — full implementation in phase 4.
interface Props {
  pageIndex: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ pageIndex, pageCount, onPageChange }: Props) {
  return (
    <div className="grid-pagination">
      <button disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)}>
        Prev
      </button>
      <span>
        {pageIndex + 1} / {pageCount}
      </span>
      <button disabled={pageIndex >= pageCount - 1} onClick={() => onPageChange(pageIndex + 1)}>
        Next
      </button>
    </div>
  )
}
