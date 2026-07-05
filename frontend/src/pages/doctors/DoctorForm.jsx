import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDoctor, createDoctor, updateDoctor } from '../../api/doctors'
import Spinner from '../../components/Spinner'

const SPECIALIZATIONS = [
  'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Neurology', 'Obstetrics & Gynaecology', 'Oncology',
  'Ophthalmology', 'Orthopaedics', 'Paediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Surgery', 'Urology',
]

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971']

const empty = {
  firstName: '', middleName: '', lastName: '',
  specialization: 'General Practice',
  countryCode: '+91', phoneNumber: '', email: ''
}

export default function DoctorForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getDoctor(id)
      .then(d => setForm({
        firstName: d.firstName, middleName: d.middleName ?? '',
        lastName: d.lastName, specialization: d.specialization,
        countryCode: d.countryCode, phoneNumber: d.phoneNumber,
        email: d.email ?? ''
      }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        middleName: form.middleName || null,
        email: form.email || null
      }
      if (isEdit) await updateDoctor(id, payload)
      else await createDoctor(payload)
      navigate('/doctors')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-6">{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h3>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input className="input" required value={form.firstName} onChange={set('firstName')} />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input className="input" value={form.middleName} onChange={set('middleName')} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className="input" required value={form.lastName} onChange={set('lastName')} />
          </div>
        </div>

        <div>
          <label className="label">Specialisation *</label>
          <select className="input" required value={form.specialization} onChange={set('specialization')}>
            {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Country Code *</label>
            <select className="input" value={form.countryCode} onChange={set('countryCode')}>
              {COUNTRY_CODES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Mobile Number *</label>
            <input className="input" required value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="98765 43210" />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Doctor' : 'Add Doctor'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/doctors')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
