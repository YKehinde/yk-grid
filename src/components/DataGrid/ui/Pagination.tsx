import styles from '../DataGrid.module.css'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface Props {
  pageIndex: number
  pageCount: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ pageIndex, pageCount, pageSize, totalRows, onPageChange, onPageSizeChange }: Props) {
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className={styles.pagination} role="navigation" aria-label="Pagination">
      <span className={styles.paginationInfo}>
        {totalRows === 0 ? 'No results' : `${start}–${end} of ${totalRows}`}
      </span>

      <div className={styles.paginationControls}>
        <label className={styles.pageSizeLabel}>
          Rows
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <button
          className={styles.paginationBtn}
          disabled={pageIndex === 0}
          onClick={() => onPageChange(0)}
          aria-label="First page"
        >
          «
        </button>
        <button
          className={styles.paginationBtn}
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className={styles.paginationInfo} aria-current="page">
          {pageIndex + 1} / {pageCount}
        </span>
        <button
          className={styles.paginationBtn}
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageIndex + 1)}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          className={styles.paginationBtn}
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageCount - 1)}
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  )
}
