/**
 * Clickable table header cell for a sortable column. `sort` is the current
 * sort string (`field` / `-field`, leading `-` = descending); clicking
 * toggles ascending → descending → ascending for this field via `onSort(field)`.
 */
export default function SortableHeader({ field, label, sort, onSort }) {
  const active = sort === field || sort === `-${field}`
  const desc = sort === `-${field}`
  return (
    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      <button
        type="button"
        className="flex items-center gap-1 hover:text-gray-700"
        onClick={() => onSort(field)}
      >
        {label}
        {active && <span aria-hidden="true">{desc ? '▼' : '▲'}</span>}
      </button>
    </th>
  )
}
