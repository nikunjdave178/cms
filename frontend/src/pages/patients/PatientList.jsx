import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPatients, deletePatient, exportPatients } from '../../api/patients'
import { useStaticValues } from '../../hooks/useStaticValues'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'
import Select from '../../components/Select'
import DatePicker from '../../components/DatePicker'
import Pagination from '../../components/Pagination'
import SortableHeader from '../../components/SortableHeader'
import { fullName } from '../../utils/format'

const emptyFilters = { search: '', genderId: '', bloodGroupId: '', city: '', state: '', registeredFrom: '', registeredTo: '' }

const COLUMNS = [
  { field: 'patientNumber', label: 'Patient No.' },
  { field: 'name', label: 'Name' },
  { field: 'gender', label: 'Gender' },
  { field: 'dob', label: 'DOB' },
  { field: 'mobile', label: 'Mobile' },
  { field: 'city', label: 'City' },
  { field: 'state', label: 'State' },
  { field: 'bloodgroup', label: 'Blood Group' },
  { field: 'registered', label: 'Registered' },
]

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [exporting, setExporting] = useState(false)

  const [filters, setFilters] = useState(emptyFilters)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('-registered')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { values: genders } = useStaticValues('GENDER')
  const { values: bloodGroups } = useStaticValues('BLOOD_GROUP')

  const filtersDirty = JSON.stringify(draftFilters) !== JSON.stringify(filters)
  const filtersActive = Object.values(filters).some(Boolean)

  const buildParams = () => ({
    search: filters.search || undefined,
    genderId: filters.genderId || undefined,
    bloodGroupId: filters.bloodGroupId || undefined,
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
    try {
      await deletePatient(deleteTarget.id)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleteTarget(null)
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

  const genderOptions = [{ value: '', label: 'All genders' }, ...genders.map(g => ({ value: g.id, label: g.displayValue }))]
  const bloodGroupOptions = [{ value: '', label: 'All blood groups' }, ...bloodGroups.map(b => ({ value: b.id, label: b.displayValue }))]

  return (
    <div className="space-y-4">
      <form onSubmit={handleApplyFilters} className="card py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Patient no., name or mobile…"
              value={draftFilters.search}
              onChange={e => setDraftFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <div className="w-36">
            <label className="label">Gender</label>
            <Select
              value={draftFilters.genderId}
              onChange={v => setDraftFilters(f => ({ ...f, genderId: v }))}
              options={genderOptions}
            />
          </div>
          <div className="w-40">
            <label className="label">Blood Group</label>
            <Select
              value={draftFilters.bloodGroupId}
              onChange={v => setDraftFilters(f => ({ ...f, bloodGroupId: v }))}
              options={bloodGroupOptions}
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
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLUMNS.map(c => (
                    <SortableHeader key={c.field} field={c.field} label={c.label} sort={sort} onSort={handleSort} />
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-gray-400">No patients found.</td></tr>
                ) : patients.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      <Link to={`/app/patients/${p.id}`} className="hover:underline">{p.patientNumber}</Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-600">
                      <Link to={`/app/patients/${p.id}`}>{fullName(p)}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.genderDisplay}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(p.dateOfBirth), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.countryCode} {p.phoneNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{p.city ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.state ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.bloodGroupDisplay ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
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
    </div>
  )
}
