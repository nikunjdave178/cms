import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser, createUser, updateUser } from '../../api/users'
import Spinner from '../../components/Spinner'
import Select from '../../components/Select'
import { useTabTitle } from '../../hooks/useTabTitle'

const ROLES = ['Admin', 'Doctor', 'Receptionist']

const empty = { fullName: '', email: '', role: 'Receptionist', isActive: true, password: '' }

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  useTabTitle(isEdit ? 'Edit User' : 'Add User')

  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getUser(id)
      .then(u => setForm({ fullName: u.fullName, email: u.email, role: u.role, isActive: u.isActive, password: '' }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (field) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await updateUser(id, {
          fullName: form.fullName, role: form.role, isActive: form.isActive,
          password: form.password || null,
        })
      } else {
        await createUser({
          fullName: form.fullName, email: form.email, role: form.role, password: form.password,
        })
      }
      navigate('/users')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-6">{isEdit ? 'Edit User' : 'Add User'}</h3>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" required value={form.fullName} onChange={set('fullName')} />
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            className="input" type="email" required
            value={form.email} onChange={set('email')} disabled={isEdit}
          />
        </div>

        <div>
          <label className="label">Role *</label>
          <Select
            value={form.role}
            onChange={set('role')}
            options={ROLES.map(r => ({ value: r, label: r }))}
          />
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={form.isActive} onChange={set('isActive')} />
            <label htmlFor="isActive" className="label mb-0">Active</label>
          </div>
        )}

        <div>
          <label className="label">{isEdit ? 'Reset Password' : 'Password *'}</label>
          <input
            className="input" type="password" required={!isEdit}
            value={form.password} onChange={set('password')}
            placeholder={isEdit ? 'Leave blank to keep current password' : ''}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update User' : 'Add User'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/users')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
