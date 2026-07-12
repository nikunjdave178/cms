import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPatient } from '../../api/patients'
import { useStaticValues } from '../../hooks/useStaticValues'
import Spinner from '../../components/Spinner'
import { useTabTitle } from '../../hooks/useTabTitle'
import { useToast } from '../../context/ToastContext'
import { fullName } from '../../utils/format'
import PatientFormFields, {
  emptyPatientForm, validatePatientForm, buildPatientPayload, normalizeFieldKey,
} from './PatientFormFields'

export default function PatientForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  useTabTitle('Register New Patient')

  const { values: genders, loading: gLoading } = useStaticValues('GENDER')
  const { values: bloodGroups, loading: bgLoading } = useStaticValues('BLOOD_GROUP')

  const [form, setForm] = useState(emptyPatientForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm(f => ({ ...f, [field]: value }))
    setErrors(errs => ({ ...errs, [field]: undefined }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)

    const errs = validatePatientForm(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError('Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      const payload = buildPatientPayload(form)
      await createPatient(payload)
      showToast(`Patient "${fullName(form)}" created successfully.`)
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

  if (gLoading || bgLoading) return <Spinner />

  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3 mb-6">
        <h3 className="text-lg font-semibold">Register New Patient</h3>
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} noValidate className="card space-y-5">
        <PatientFormFields form={form} errors={errors} set={set} genders={genders} bloodGroups={bloodGroups} />
        <div className="flex gap-3 pt-2">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Register Patient'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/app/patients')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
