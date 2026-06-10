// Stub — full implementation in phase 4.
import styles from '../DataGrid.module.css'

interface Props {
  pageIndex: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ pageIndex, pageCount, onPageChange }: Props) {
  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        Page {pageIndex + 1} of {pageCount}
      </span>
      <div className={styles.paginationControls}>
        <button
          className={styles.paginationBtn}
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
        >
          ← Prev
        </button>
        <button
          className={styles.paginationBtn}
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageIndex + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
