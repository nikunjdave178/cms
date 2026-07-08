import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPatient, createPatient, updatePatient } from '../../api/patients'
import { useStaticValues } from '../../hooks/useStaticValues'
import Spinner from '../../components/Spinner'
import DatePicker from '../../components/DatePicker'
import CountryCodeSelect from '../../components/CountryCodeSelect'
import { PHONE_LENGTHS } from '../../data/countries'
import { IN_STATES, IN_CITIES, CITY_PINCODES, lookupPincode, lookupCity } from '../../data/pincodes'

const empty = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '',
  genderId: '', countryCode: '+91', phoneNumber: '',
  email: '', address: '', city: '', state: '', pincode: '',
  bloodGroupId: '', notes: ''
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(form) {
  const errs = {}
  const today = new Date().toISOString().slice(0, 10)

  if (!form.firstName.trim()) errs.firstName = 'First name is required.'
  else if (form.firstName.trim().length > 100) errs.firstName = 'Max 100 characters.'
  if (form.middleName.trim().length > 100) errs.middleName = 'Max 100 characters.'
  if (!form.lastName.trim()) errs.lastName = 'Last name is required.'
  else if (form.lastName.trim().length > 100) errs.lastName = 'Max 100 characters.'

  if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required.'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) errs.dateOfBirth = 'Enter a valid date with a 4-digit year.'
  else {
    const year = Number(form.dateOfBirth.slice(0, 4))
    if (year < 1900) errs.dateOfBirth = 'Year must be 1900 or later.'
    else if (form.dateOfBirth > today) errs.dateOfBirth = 'Date of birth cannot be in the future.'
  }

  if (!form.genderId) errs.genderId = 'Gender is required.'

  const phone = form.phoneNumber
  if (!phone) errs.phoneNumber = 'Mobile number is required.'
  else if (!/^\d+$/.test(phone)) errs.phoneNumber = 'Digits only — no spaces or symbols.'
  else {
    const lengths = PHONE_LENGTHS[form.countryCode]
    if (lengths && !lengths.includes(phone.length))
      errs.phoneNumber = `Must be ${lengths.join(' or ')} digits for ${form.countryCode}.`
    else if (!lengths && (phone.length < 6 || phone.length > 15))
      errs.phoneNumber = 'Must be 6–15 digits.'
    else if (form.countryCode === '+91' && !/^[6-9]/.test(phone))
      errs.phoneNumber = 'Indian mobile numbers start with 6–9.'
  }

  if (form.email && !EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.'
  if (form.address.trim().length > 255) errs.address = 'Max 255 characters.'
  if (form.city.trim().length > 100) errs.city = 'Max 100 characters.'
  if (form.state.trim().length > 100) errs.state = 'Max 100 characters.'

  if (form.pincode) {
    if (form.countryCode === '+91' && !/^\d{6}$/.test(form.pincode))
      errs.pincode = 'Indian PIN codes are exactly 6 digits.'
    else if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(form.pincode))
      errs.pincode = '3–10 letters, digits, spaces or hyphens.'
  }
  if (form.notes.length > 2000) errs.notes = 'Max 2000 characters.'

  return errs
}

// Map ASP.NET ValidationProblem field keys ("DateOfBirth", "$.phoneNumber") to form fields.
const normalizeFieldKey = (key) => {
  const k = key.replace(/^\$\./, '').replace(/^req\./i, '')
  return k.charAt(0).toLowerCase() + k.slice(1)
}

function FieldError({ msg }) {
  return msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null
}

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { values: genders, loading: gLoading } = useStaticValues('GENDER')
  const { values: bloodGroups, loading: bgLoading } = useStaticValues('BLOOD_GROUP')

  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
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

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm(f => ({ ...f, [field]: value }))
    setErrors(errs => ({ ...errs, [field]: undefined }))
  }

  // Digits-only mobile input, capped at the expected length for the country.
  const setPhone = (e) => {
    const lengths = PHONE_LENGTHS[form.countryCode]
    const maxLen = lengths ? Math.max(...lengths) : 15
    set('phoneNumber')(e.target.value.replace(/\D/g, '').slice(0, maxLen))
  }

  // Typing a zip autofills city + state from factory data (free text still allowed).
  const setPincode = (e) => {
    const pin = e.target.value.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 10)
    setForm(f => {
      const found = lookupPincode(pin)
      return {
        ...f,
        pincode: pin,
        city: found.city ?? f.city,
        state: found.state ?? f.state,
      }
    })
    setErrors(errs => ({ ...errs, pincode: undefined, city: undefined, state: undefined }))
  }

  // Picking/typing a known city fills its state (and zip when empty).
  const setCity = (e) => {
    const city = e.target.value
    setForm(f => {
      const found = lookupCity(city)
      return {
        ...f,
        city,
        state: found ? found.state : f.state,
        pincode: found && !f.pincode ? found.pin : f.pincode,
      }
    })
    setErrors(errs => ({ ...errs, city: undefined }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)

    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError('Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        genderId: Number(form.genderId),
        countryCode: form.countryCode,
        phoneNumber: form.phoneNumber,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
        bloodGroupId: form.bloodGroupId ? Number(form.bloodGroupId) : null,
        notes: form.notes.trim() || null,
      }
      if (isEdit) await updatePatient(id, payload)
      else await createPatient(payload)
      navigate('/patients')
    } catch (e) {
      if (e.fields) {
        const mapped = {}
        for (const [key, msgs] of Object.entries(e.fields))
          mapped[normalizeFieldKey(key)] = Array.isArray(msgs) ? msgs[0] : String(msgs)
        setErrors(mapped)
        setError('Please fix the highlighted fields.')
      } else {
        setError(e.message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || gLoading || bgLoading) return <Spinner />

  const inputCls = (field) => `input ${errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`
  const phoneLengths = PHONE_LENGTHS[form.countryCode]

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-6">{isEdit ? 'Edit Patient' : 'Register New Patient'}</h3>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} noValidate className="card space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input className={inputCls('firstName')} maxLength={100} value={form.firstName} onChange={set('firstName')} />
            <FieldError msg={errors.firstName} />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input className={inputCls('middleName')} maxLength={100} value={form.middleName} onChange={set('middleName')} placeholder="Optional" />
            <FieldError msg={errors.middleName} />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input className={inputCls('lastName')} maxLength={100} value={form.lastName} onChange={set('lastName')} />
            <FieldError msg={errors.lastName} />
          </div>
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date of Birth *</label>
            <DatePicker
              value={form.dateOfBirth}
              onChange={set('dateOfBirth')}
              minYear={1900}
              className={errors.dateOfBirth ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
            />
            <FieldError msg={errors.dateOfBirth} />
          </div>
          <div>
            <label className="label">Gender *</label>
            <select className={inputCls('genderId')} value={form.genderId} onChange={set('genderId')}>
              <option value="">Select…</option>
              {genders.map(g => <option key={g.id} value={g.id}>{g.displayValue}</option>)}
            </select>
            <FieldError msg={errors.genderId} />
          </div>
        </div>

        {/* Phone */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Country Code *</label>
            <CountryCodeSelect value={form.countryCode} onChange={set('countryCode')} />
          </div>
          <div className="col-span-2">
            <label className="label">Mobile Number *</label>
            <input
              className={inputCls('phoneNumber')}
              inputMode="numeric"
              value={form.phoneNumber}
              onChange={setPhone}
              placeholder={form.countryCode === '+91' ? '9876543210' : 'Digits only'}
            />
            {errors.phoneNumber
              ? <FieldError msg={errors.phoneNumber} />
              : phoneLengths && (
                <p className="mt-1 text-xs text-gray-400">
                  {phoneLengths.join(' or ')} digits for {form.countryCode}
                </p>
              )}
          </div>
        </div>

        {/* Email + Blood Group */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input className={inputCls('email')} type="email" maxLength={255} value={form.email} onChange={set('email')} />
            <FieldError msg={errors.email} />
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
          <input className={inputCls('address')} maxLength={255} value={form.address} onChange={set('address')} placeholder="House No., Street" />
          <FieldError msg={errors.address} />
        </div>

        {/* Pincode / City / State — free text with dropdown suggestions + autofill */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Pincode / ZIP</label>
            <input
              className={inputCls('pincode')}
              list="pincode-options"
              value={form.pincode}
              onChange={setPincode}
              maxLength={10}
              placeholder="e.g. 400001"
              autoComplete="off"
            />
            <datalist id="pincode-options">
              {CITY_PINCODES.map(e => (
                <option key={e.pin} value={e.pin}>{e.city}, {e.state}</option>
              ))}
            </datalist>
            <FieldError msg={errors.pincode} />
          </div>
          <div>
            <label className="label">City</label>
            <input
              className={inputCls('city')}
              list="city-options"
              maxLength={100}
              value={form.city}
              onChange={setCity}
              autoComplete="off"
            />
            <datalist id="city-options">
              {IN_CITIES.map(e => <option key={e.city} value={e.city}>{e.state}</option>)}
            </datalist>
            <FieldError msg={errors.city} />
          </div>
          <div>
            <label className="label">State</label>
            <input
              className={inputCls('state')}
              list="state-options"
              maxLength={100}
              value={form.state}
              onChange={set('state')}
              autoComplete="off"
            />
            <datalist id="state-options">
              {IN_STATES.map(s => <option key={s} value={s} />)}
            </datalist>
            <FieldError msg={errors.state} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Medical Notes</label>
          <textarea className={`${inputCls('notes')} resize-none`} rows={3} maxLength={2000} value={form.notes} onChange={set('notes')} />
          <FieldError msg={errors.notes} />
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
