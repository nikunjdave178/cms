import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPatient, createPatient, updatePatient } from '../../api/patients'
import { lookupPincodeApi, suggestPincodes } from '../../api/pincodes'
import { useStaticValues } from '../../hooks/useStaticValues'
import Spinner from '../../components/Spinner'
import DatePicker from '../../components/DatePicker'
import Select from '../../components/Select'
import Combobox from '../../components/Combobox'
import CountryCodeSelect from '../../components/CountryCodeSelect'
import { PHONE_LENGTHS, COUNTRIES_INDIA_FIRST } from '../../data/countries'
import { IN_STATES, IN_CITIES, CITY_PINCODES, lookupPincode, lookupCity } from '../../data/pincodes'
import { useTabTitle } from '../../hooks/useTabTitle'

const empty = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '',
  genderId: '', countryCode: '+91', phoneNumber: '',
  email: '', address: '', city: '', state: '', pincode: '', country: 'India',
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
    if (form.country === 'India' && !/^\d{6}$/.test(form.pincode))
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

  useTabTitle(isEdit ? 'Edit Patient' : 'Register New Patient')

  const { values: genders, loading: gLoading } = useStaticValues('GENDER')
  const { values: bloodGroups, loading: bgLoading } = useStaticValues('BLOOD_GROUP')

  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [pinSuggestions, setPinSuggestions] = useState([])
  const pinDebounce = useRef(null)
  const [patientNumber, setPatientNumber] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    getPatient(id)
      .then(p => {
        setPatientNumber(p.patientNumber)
        setForm({
          firstName: p.firstName, middleName: p.middleName ?? '',
          lastName: p.lastName, dateOfBirth: p.dateOfBirth,
          genderId: String(p.genderId),
          countryCode: p.countryCode, phoneNumber: p.phoneNumber,
          email: p.email ?? '', address: p.address ?? '',
          city: p.city ?? '', state: p.state ?? '', pincode: p.pincode ?? '',
          country: p.country ?? 'India',
          bloodGroupId: p.bloodGroupId ? String(p.bloodGroupId) : '',
          notes: p.notes ?? ''
        })
      })
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

  // Typing a zip autofills city + state: instant fill from the local factory
  // data, then the full data.gov.in directory on the server (authoritative)
  // once enough digits are typed. Suggestions feed the dropdown.
  const setPincode = (val) => {
    const pin = val.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 10)
    setForm(f => {
      const found = f.country === 'India' ? lookupPincode(pin) : {}
      return {
        ...f,
        pincode: pin,
        city: found.city ?? f.city,
        state: found.state ?? f.state,
      }
    })
    setErrors(errs => ({ ...errs, pincode: undefined, city: undefined, state: undefined }))

    clearTimeout(pinDebounce.current)
    if (form.country !== 'India' || !/^\d{2,6}$/.test(pin)) {
      setPinSuggestions([])
      return
    }
    pinDebounce.current = setTimeout(async () => {
      try {
        if (pin.length === 6) {
          const exact = await lookupPincodeApi(pin)
          setForm(f => f.pincode === pin
            ? { ...f, city: exact.city, state: exact.state }
            : f)
          setPinSuggestions([exact])
        } else {
          setPinSuggestions(await suggestPincodes(pin))
        }
      } catch {
        // offline or unknown PIN — the local factory fill above stands
      }
    }, 300)
  }

  const pickPincode = (opt) => {
    setForm(f => ({ ...f, pincode: opt.value, city: opt.city, state: opt.state }))
    setPinSuggestions([])
  }

  // Picking/typing a known city fills its state (and zip when empty).
  const setCity = (val) => {
    setForm(f => {
      const found = f.country === 'India' ? lookupCity(val) : null
      return {
        ...f,
        city: val,
        state: found ? found.state : f.state,
        pincode: found && !f.pincode ? found.pin : f.pincode,
      }
    })
    setErrors(errs => ({ ...errs, city: undefined }))
  }

  const pickCity = (opt) => {
    setForm(f => ({ ...f, city: opt.value, state: opt.state, pincode: opt.pin && !f.pincode ? opt.pin : f.pincode }))
  }

  const setState = (val) => {
    setForm(f => ({ ...f, state: val }))
    setErrors(errs => ({ ...errs, state: undefined }))
  }

  const pinOptions = (pinSuggestions.length > 0 ? pinSuggestions : CITY_PINCODES.map(e => ({ pincode: e.pin, city: e.city, state: e.state })))
    .map(s => ({ value: s.pincode, label: s.pincode, sublabel: `${s.city}, ${s.state}`, city: s.city, state: s.state }))

  const cityOptions = IN_CITIES.map(e => ({ value: e.city, label: e.city, sublabel: e.state, state: e.state, pin: e.pin }))
  const stateOptions = IN_STATES.map(s => ({ value: s, label: s }))

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
        country: form.country.trim() || null,
        bloodGroupId: form.bloodGroupId ? Number(form.bloodGroupId) : null,
        notes: form.notes.trim() || null,
      }
      if (isEdit) await updatePatient(id, payload)
      else await createPatient(payload)
      navigate('/app/patients')
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
  const isIndia = form.country === 'India'

  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3 mb-6">
        <h3 className="text-lg font-semibold">{isEdit ? 'Edit Patient' : 'Register New Patient'}</h3>
        {isEdit && patientNumber && (
          <span className="font-mono text-sm text-gray-400">{patientNumber}</span>
        )}
      </div>
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
              error={errors.dateOfBirth}
            />
          </div>
          <div>
            <label className="label">Gender *</label>
            <Select
              value={form.genderId}
              onChange={set('genderId')}
              options={genders.map(g => ({ value: String(g.id), label: g.displayValue }))}
              placeholder="Select…"
              error={Boolean(errors.genderId)}
            />
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
            <Select
              value={form.bloodGroupId}
              onChange={set('bloodGroupId')}
              options={[
                { value: '', label: 'Unknown' },
                ...bloodGroups.map(b => ({ value: String(b.id), label: b.displayValue })),
              ]}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label">Address (House / Street)</label>
          <input className={inputCls('address')} maxLength={255} value={form.address} onChange={set('address')} placeholder="House No., Street" />
          <FieldError msg={errors.address} />
        </div>

        {/* Country / Pincode / City / State — free text with dropdown suggestions + autofill */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Country</label>
            <Select
              value={form.country}
              onChange={set('country')}
              searchable
              options={COUNTRIES_INDIA_FIRST.map(c => ({ value: c.name, label: c.name, key: c.iso2 }))}
              error={Boolean(errors.country)}
            />
            <FieldError msg={errors.country} />
          </div>
          <div>
            <label className="label">Pincode / ZIP</label>
            {isIndia ? (
              <Combobox
                value={form.pincode}
                onChange={setPincode}
                onSelect={pickPincode}
                options={pinOptions}
                maxLength={10}
                error={Boolean(errors.pincode)}
                placeholder="e.g. 400001"
              />
            ) : (
              <input
                className={inputCls('pincode')}
                value={form.pincode}
                onChange={e => setPincode(e.target.value)}
                maxLength={10}
                placeholder="ZIP / postal code"
                autoComplete="off"
              />
            )}
            <FieldError msg={errors.pincode} />
          </div>
          <div>
            <label className="label">City</label>
            {isIndia ? (
              <Combobox
                value={form.city}
                onChange={setCity}
                onSelect={pickCity}
                options={cityOptions}
                maxLength={100}
                error={Boolean(errors.city)}
              />
            ) : (
              <input
                className={inputCls('city')}
                maxLength={100}
                value={form.city}
                onChange={e => setCity(e.target.value)}
                autoComplete="off"
              />
            )}
            <FieldError msg={errors.city} />
          </div>
          <div>
            <label className="label">State</label>
            {isIndia ? (
              <Combobox
                value={form.state}
                onChange={setState}
                options={stateOptions}
                maxLength={100}
                error={Boolean(errors.state)}
              />
            ) : (
              <input
                className={inputCls('state')}
                maxLength={100}
                value={form.state}
                onChange={set('state')}
                autoComplete="off"
              />
            )}
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
          <button className="btn-secondary" type="button" onClick={() => navigate('/app/patients')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
