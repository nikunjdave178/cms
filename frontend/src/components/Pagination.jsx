import Select from './Select'

/**
 * Standard list-footer pagination: "Showing X–Y of Z", a page-size picker,
 * and prev/next page controls. Fully controlled — the caller owns page state
 * and refetches on change.
 */
export default function Pagination({
  page, pageSize, totalCount, onPageChange, onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
      <div>
        {totalCount === 0 ? 'No records' : `Showing ${from}–${to} of ${totalCount}`}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-gray-500">Rows per page</span>
          <Select
            size="sm"
            className="w-20"
            value={pageSize}
            onChange={v => onPageSizeChange(Number(v))}
            options={pageSizeOptions.map(n => ({ value: n, label: String(n) }))}
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
