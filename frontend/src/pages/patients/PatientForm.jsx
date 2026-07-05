import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPatient, createPatient, updatePatient } from '../../api/patients'
import { useStaticValues } from '../../hooks/useStaticValues'
import Spinner from '../../components/Spinner'

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971']

const empty = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '',
  genderId: '', countryCode: '+91', phoneNumber: '',
  email: '', address: '', city: '', state: '', pincode: '',
  bloodGroupId: '', notes: ''
}

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { values: genders, loading: gLoading } = useStaticValues('GENDER')
  const { values: bloodGroups, loading: bgLoading } = useStaticValues('BLOOD_GROUP')

  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getPatient(id)
      .then(p => setForm({
        firstName: p.firstName, middleName: p.middleName ?? '',
        lastName: p.lastName, dateOfBirth: p.dateOfBirth,
        genderId: String(p.genderId),
        countryCode: p.countryCode, phoneNumber: p.phoneNumber,
        email: p.email ?? '', address: p.address ?? '',
        city: p.city ?? '', state: p.state ?? '', pincode: p.pincode ?? '',
        bloodGroupId: p.bloodGroupId ? String(p.bloodGroupId) : '',
        notes: p.notes ?? ''
      }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // Set default gender once options load
  useEffect(() => {
    if (!isEdit && genders.length > 0 && !form.genderId)
      setForm(f => ({ ...f, genderId: String(genders[0].id) }))
  }, [genders, isEdit])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        firstName: form.firstName,
        middleName: form.middleName || null,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        genderId: Number(form.genderId),
        countryCode: form.countryCode,
        phoneNumber: form.phoneNumber,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        bloodGroupId: form.bloodGroupId ? Number(form.bloodGroupId) : null,
        notes: form.notes || null,
      }
      if (isEdit) await updatePatient(id, payload)
      else await createPatient(payload)
      navigate('/patients')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || gLoading || bgLoading) return <Spinner />

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-6">{isEdit ? 'Edit Patient' : 'Register New Patient'}</h3>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Name row */}
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

        {/* DOB + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date of Birth *</label>
            <input className="input" type="date" required value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          </div>
          <div>
            <label className="label">Gender *</label>
            <select className="input" required value={form.genderId} onChange={set('genderId')}>
              <option value="">Select…</option>
              {genders.map(g => <option key={g.id} value={g.id}>{g.displayValue}</option>)}
            </select>
          </div>
        </div>

        {/* Phone */}
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

        {/* Email + Blood Group */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Blood Group</label>
            <select className="input" value={form.bloodGroupId} onChange={set('bloodGroupId')}>
              <option value="">Unknown</option>
              {bloodGroups.map(b => <option key={b.id} value={b.id}>{b.displayValue}</option>)}
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label">Address (House / Street)</label>
          <input className="input" value={form.address} onChange={set('address')} placeholder="House No., Street" />
        </div>

        {/* City / State / Pincode */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={set('city')} />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state} onChange={set('state')} />
          </div>
          <div>
            <label className="label">Pincode</label>
            <input className="input" value={form.pincode} onChange={set('pincode')} maxLength={6} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Medical Notes</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Patient' : 'Register Patient'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/patients')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
