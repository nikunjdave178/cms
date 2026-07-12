import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

/**
 * Clickable table header cell for a sortable column. `sort` is the current
 * sort string (`field` / `-field`, leading `-` = descending); clicking
 * toggles ascending → descending → ascending for this field via `onSort(field)`.
 *
 * Always shows a sort-icon affordance (faint ⇅ when inactive, a solid arrow
 * once active) so a sortable column is visually distinguishable at a glance
 * from a plain, non-sortable `<th>` — not every column supports ordering
 * (some would require an expensive unindexed/joined-column sort), so columns
 * that don't should render as plain headers instead of this component.
 */
export default function SortableHeader({ field, label, sort, onSort, className = '' }) {
  const active = sort === field || sort === `-${field}`
  const desc = sort === `-${field}`
  const Icon = active ? (desc ? ArrowDown : ArrowUp) : ArrowUpDown
  return (
    <th className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${className}`}>
      <button
        type="button"
        className={`flex items-center gap-1 hover:text-gray-700 ${active ? 'text-gray-700' : ''}`}
        onClick={() => onSort(field)}
      >
        {label}
        <Icon className={active ? 'h-3 w-3' : 'h-3 w-3 text-gray-300'} strokeWidth={2} aria-hidden="true" />
      </button>
    </th>
  )
}
