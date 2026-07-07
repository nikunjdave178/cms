import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDoctors, deleteDoctor } from '../../api/doctors'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'

const fullName = (d) =>
  [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ')

export default function DoctorList() {
  const { hasRole } = useAuth()
  const canEdit = hasRole('Admin')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    getDoctors().then(setDoctors).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    await deleteDoctor(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Link to="/doctors/new" className="btn-primary">+ Add Doctor</Link>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Specialisation', 'Mobile', 'Email', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No doctors registered.</td></tr>
              ) : doctors.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">Dr. {fullName(d)}</td>
                  <td className="px-4 py-3 text-gray-600">{d.specialization}</td>
                  <td className="px-4 py-3 text-gray-600">{d.countryCode} {d.phoneNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{d.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && <>
                      <Link to={`/doctors/${d.id}/edit`} className="btn-secondary text-xs mr-2">Edit</Link>
                      <button className="btn-danger text-xs" onClick={() => setDeleteTarget(d)}>Delete</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Remove Dr. ${fullName(deleteTarget)}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
