import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, deleteUser } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'

const roleColors = {
  Admin: 'badge bg-indigo-100 text-indigo-800',
  Doctor: 'badge bg-blue-100 text-blue-800',
  Receptionist: 'badge bg-teal-100 text-teal-800',
}

export default function UserList() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    getUsers().then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    setError(null)
    try {
      await deleteUser(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (e) {
      setError(e.message)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex justify-end">
        <Link to="/users/new" className="btn-primary">+ Add User</Link>
      </div>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Role', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {u.fullName} {u.id === currentUser?.id && <span className="text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={roleColors[u.role] ?? 'badge bg-gray-100 text-gray-700'}>{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={u.isActive ? 'badge bg-green-100 text-green-800' : 'badge bg-gray-100 text-gray-500'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/users/${u.id}/edit`} className="btn-secondary text-xs mr-2">Edit</Link>
                    <button className="btn-danger text-xs" onClick={() => setDeleteTarget(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete user "${deleteTarget.fullName}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
