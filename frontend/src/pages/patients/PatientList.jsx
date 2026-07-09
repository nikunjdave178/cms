import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPatients, deletePatient } from '../../api/patients'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'
import { fullName } from '../../utils/format'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState(null)

  const load = (s) => {
    setLoading(true)
    getPatients(s)
      .then(setPatients)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load('') }, [])

  const handleSearch = e => {
    e.preventDefault()
    load(search)
  }

  const handleDelete = async () => {
    try {
      await deletePatient(deleteTarget.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleteTarget(null)
    }
    load(search)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            className="input max-w-xs"
            placeholder="Search by patient no., name or mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-secondary" type="submit">Search</button>
          {search && (
            <button className="btn-secondary" type="button" onClick={() => { setSearch(''); load('') }}>
              Clear
            </button>
          )}
        </form>
        <Link to="/patients/new" className="btn-primary">+ New Patient</Link>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Patient No.', 'Name', 'Gender', 'DOB', 'Mobile', 'Blood Group', 'Registered', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No patients found.</td></tr>
              ) : patients.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    <Link to={`/patients/${p.id}`} className="hover:underline">{p.patientNumber}</Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary-600">
                    <Link to={`/patients/${p.id}`}>{fullName(p)}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.genderDisplay}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(p.dateOfBirth), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.countryCode} {p.phoneNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{p.bloodGroupDisplay ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(p.createdAt), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/patients/${p.id}/edit`} className="btn-secondary text-xs mr-2">Edit</Link>
                    <button className="btn-danger text-xs" onClick={() => setDeleteTarget(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
