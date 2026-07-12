import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { getPatients, deletePatient, exportPatients } from '../../api/patients'
import { useStaticValues } from '../../hooks/useStaticValues'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorModal from '../../components/ErrorModal'
import MultiSelect from '../../components/MultiSelect'
import DatePicker from '../../components/DatePicker'
import Pagination from '../../components/Pagination'
import SortableHeader from '../../components/SortableHeader'
import { fullName } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useLayout } from '../../context/LayoutContext'

const emptyFilters = {
  patientNumber: '', name: '', mobile: '', genderIds: [], bloodGroupIds: [], city: '', state: '', registeredFrom: '', registeredTo: '',
}

// Gender/Blood Group are deliberately not sortable — they'd sort on the
// joined StaticValues display-text column, which has no index (unlike the
// direct Patient columns below), so it's left out for performance.
// Explicit widths (with table-fixed below) keep column widths stable
// regardless of cell content — long values wrap within the cell instead of
// stretching the column and reflowing the whole table.
const COLUMNS = [
  { field: 'patientNumber', label: 'Patient No.', sortable: true, width: 'w-[9%]' },
  { field: 'name', label: 'Name', sortable: true, width: 'w-[15%]' },
  { field: 'gender', label: 'Gender', sortable: false, width: 'w-[8%]' },
  { field: 'dob', label: 'DOB', sortable: true, width: 'w-[9%]' },
  { field: 'mobile', label: 'Mobile', sortable: false, width: 'w-[11%]' },
  { field: 'city', label: 'City', sortable: true, width: 'w-[9%]' },
  { field: 'state', label: 'State', sortable: true, width: 'w-[9%]' },
  { field: 'bloodgroup', label: 'Blood Group', sortable: false, width: 'w-[9%]' },
  { field: 'registered', label: 'Registered', sortable: true, width: 'w-[9%]' },
]

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)

  const [filters, setFilters] = useState(emptyFilters)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('-registered')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { values: genders } = useStaticValues('GENDER')
  const { values: bloodGroups } = useStaticValues('BLOOD_GROUP')
  const { showToast } = useToast()
  const { closeTab } = useLayout()

  const filtersDirty = JSON.stringify(draftFilters) !== JSON.stringify(filters)
  const filtersActive = Object.values(filters).some(v => (Array.isArray(v) ? v.length > 0 : Boolean(v)))

  const buildParams = () => ({
    patientNumber: filters.patientNumber || undefined,
    name: filters.name || undefined,
    mobile: filters.mobile || undefined,
    genderIds: filters.genderIds.length ? filters.genderIds : undefined,
    bloodGroupIds: filters.bloodGroupIds.length ? filters.bloodGroupIds : undefined,
    city: filters.city || undefined,
    state: filters.state || undefined,
    registeredFrom: filters.registeredFrom || undefined,
    registeredTo: filters.registeredTo || undefined,
    sort,
    page,
    pageSize,
  })

  const load = () => {
    setLoading(true)
    getPatients(buildParams())
      .then(res => { setPatients(res.items); setTotalCount(res.totalCount) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filters, sort, page, pageSize])

  const handleApplyFilters = (e) => {
    e?.preventDefault()
    setFilters(draftFilters)
    setPage(1)
  }

  const handleClearFilters = () => {
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    setPage(1)
  }

  const handleSort = (field) => {
    setSort(prev => (prev === field ? `-${field}` : field))
    setPage(1)
  }

  const handleDelete = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deletePatient(target.id)
      load()
      showToast(`Patient "${fullName(target)}" deleted successfully.`)
      // Close that patient's own tab too, if it happens to be open in the
      // background — its content is gone, so nothing to switch back to.
      closeTab(`/app/patients/${target.id}`)
    } catch (e) {
      setDeleteError(e.message)
    }
  }

  const handleExport = async (fmt) => {
    setExporting(true)
    setError(null)
    try {
      const blob = await exportPatients(buildParams(), fmt)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `patients-export.${fmt}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setExporting(false)
    }
  }

  const genderOptions = genders.map(g => ({ value: g.id, label: g.displayValue }))
  const bloodGroupOptions = bloodGroups.map(b => ({ value: b.id, label: b.displayValue }))

  return (
    <div className="space-y-4">
      <div className="card py-3">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
          onClick={() => setFiltersOpen(o => !o)}
          aria-expanded={filtersOpen}
        >
          Filters{filtersActive ? ' •' : ''}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
        </button>

        {filtersOpen && (
          <form onSubmit={handleApplyFilters} className="mt-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-36">
                <label className="label">Patient No.</label>
                <input
                  className="input"
                  value={draftFilters.patientNumber}
                  onChange={e => setDraftFilters(f => ({ ...f, patientNumber: e.target.value }))}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="label">Name</label>
                <input
                  className="input"
                  value={draftFilters.name}
                  onChange={e => setDraftFilters(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="w-36">
                <label className="label">Mobile</label>
                <input
                  className="input"
                  value={draftFilters.mobile}
                  onChange={e => setDraftFilters(f => ({ ...f, mobile: e.target.value }))}
                />
              </div>
              <div className="w-40">
                <label className="label">Gender</label>
                <MultiSelect
                  value={draftFilters.genderIds}
                  onChange={v => setDraftFilters(f => ({ ...f, genderIds: v }))}
                  options={genderOptions}
                  placeholder="All genders"
                />
              </div>
              <div className="w-44">
                <label className="label">Blood Group</label>
                <MultiSelect
                  value={draftFilters.bloodGroupIds}
                  onChange={v => setDraftFilters(f => ({ ...f, bloodGroupIds: v }))}
                  options={bloodGroupOptions}
                  placeholder="All blood groups"
                />
              </div>
              <div className="w-32">
                <label className="label">City</label>
                <input
                  className="input"
                  value={draftFilters.city}
                  onChange={e => setDraftFilters(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="w-32">
                <label className="label">State</label>
                <input
                  className="input"
                  value={draftFilters.state}
                  onChange={e => setDraftFilters(f => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div className="w-36">
                <label className="label">Registered From</label>
                <DatePicker
                  value={draftFilters.registeredFrom}
                  onChange={v => setDraftFilters(f => ({ ...f, registeredFrom: v }))}
                />
              </div>
              <div className="w-36">
                <label className="label">Registered To</label>
                <DatePicker
                  value={draftFilters.registeredTo}
                  onChange={v => setDraftFilters(f => ({ ...f, registeredTo: v }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClearFilters}
                  disabled={!filtersActive && !filtersDirty}
                >
                  Clear
                </button>
                <button type="submit" className="btn-primary" disabled={!filtersDirty}>Apply</button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="btn-secondary" type="button" disabled={exporting} onClick={() => handleExport('csv')}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
        <button className="btn-secondary" type="button" disabled={exporting} onClick={() => handleExport('xlsx')}>
          {exporting ? 'Exporting…' : 'Export XLSX'}
        </button>
        <Link to="/app/patients/new" className="btn-primary">+ New Patient</Link>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLUMNS.map(c => (
                    c.sortable ? (
                      <SortableHeader key={c.field} field={c.field} label={c.label} sort={sort} onSort={handleSort} className={c.width} />
                    ) : (
                      <th key={c.field} className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${c.width}`}>
                        {c.label}
                      </th>
                    )
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[12%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-gray-400">No patients found.</td></tr>
                ) : patients.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 break-words">
                      <Link to={`/app/patients/${p.id}`} className="hover:underline">{p.patientNumber}</Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-600 break-words">
                      <Link to={`/app/patients/${p.id}`}>{fullName(p)}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 break-words">{p.genderDisplay}</td>
                    <td className="px-4 py-3 text-gray-600 break-words">
                      {format(new Date(p.dateOfBirth), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 break-words">{p.countryCode} {p.phoneNumber}</td>
                    <td className="px-4 py-3 text-gray-600 break-words">{p.city ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 break-words">{p.state ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 break-words">{p.bloodGroupDisplay ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 break-words">
                      {format(new Date(p.createdAt), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/app/patients/${p.id}?edit=true`} className="btn-secondary text-xs mr-2">Edit</Link>
                      <button className="btn-danger text-xs" onClick={() => setDeleteTarget(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1) }}
          />
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete patient "${fullName(deleteTarget)}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteError && (
        <ErrorModal title="Delete Failed" message={deleteError} onClose={() => setDeleteError(null)} />
      )}
    </div>
  )
}
