import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getPatient, updatePatient, deletePatient } from '../../api/patients'
import { getAppointments } from '../../api/appointments'
import { getInvoices } from '../../api/billing'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorModal from '../../components/ErrorModal'
import { fullName } from '../../utils/format'
import { badgeClass } from '../../constants/status'
import { isDirty } from '../../utils/dirty'
import { MAIN_PATH } from '../../constants/nav'
import { useTabTitle } from '../../hooks/useTabTitle'
import { useStaticValues } from '../../hooks/useStaticValues'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { useUnsavedChanges } from '../../context/UnsavedChangesContext'
import { useToast } from '../../context/ToastContext'
import { useLayout } from '../../context/LayoutContext'
import PatientFormFields, {
  emptyPatientForm, validatePatientForm, buildPatientPayload, patientToForm, normalizeFieldKey,
} from './PatientFormFields'

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-gray-800">{value || '—'}</p>
    </div>
  )
}

function StatTile({ label, value, sub }) {
  return (
    <div className="card py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 text-gray-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
    </div>
  )
}

function ageFromDob(dob) {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--
  return age
}

const SECTIONS = [
  { key: 'summary', label: 'Summary' },
  { key: 'demographic', label: 'Demographic' },
]

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { runGuarded } = useUnsavedChanges()
  const { showToast } = useToast()
  const { closeTab } = useLayout()

  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [section, setSection] = useState('summary')
  const [form, setForm] = useState(emptyPatientForm)
  const [baseline, setBaseline] = useState(emptyPatientForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const { values: genders, loading: gLoading } = useStaticValues('GENDER')
  const { values: bloodGroups, loading: bgLoading } = useStaticValues('BLOOD_GROUP')

  const dirty = isDirty(form, baseline)

  useEffect(() => {
    setLoading(true)
    // Reset in-page state immediately whenever the patient identity changes —
    // e.g. switching to an already-open tab for a different patient. React
    // Router doesn't remount this component just because :id changed, so
    // without this, one patient's in-progress edit could leak onto another's.
    // (Switching tabs to get here already went through the unsaved-changes
    // guard at the TabBar layer, so any dirty edit was already resolved
    // before this effect ever runs.)
    setSection('summary')
    setErrors({})
    setFormError(null)
    Promise.all([getPatient(id), getAppointments({ patientId: id, pageSize: 100 }), getInvoices({ patientId: id, pageSize: 100 })])
      .then(([p, a, inv]) => {
        setPatient(p)
        setAppointments(a.items)
        setInvoices(inv.items)
        const f = patientToForm(p)
        setForm(f)
        setBaseline(f)
      })
      .finally(() => setLoading(false))
  }, [id])

  // Deep-link straight into the Demographic section (the patient list's Edit
  // button uses ?edit=true on this same route, never a separate one — the
  // section is always live now, so there's no separate "edit mode" to enter).
  // The param is stripped immediately so the URL stays clean.
  useEffect(() => {
    if (patient && searchParams.get('edit') === 'true') {
      setSection('demographic')
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient])

  useTabTitle(patient && fullName(patient))

  const handleDelete = async () => {
    setShowDelete(false)
    try {
      await deletePatient(id)
      showToast(`Patient "${fullName(patient)}" deleted successfully.`)
      // The deleted patient's own tab can't show anything valid anymore —
      // close it and land on whatever tab (if any) takes over, same as
      // closing any other tab.
      const newActive = closeTab(`/app/patients/${id}`)
      navigate(newActive ?? MAIN_PATH)
    } catch (e) {
      setDeleteError(e.message)
    }
  }

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm(f => ({ ...f, [field]: value }))
    setErrors(errs => ({ ...errs, [field]: undefined }))
  }

  const saveChanges = async () => {
    setFormError(null)
    const errs = validatePatientForm(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setFormError('Please fix the highlighted fields.')
      return false
    }
    setSaving(true)
    try {
      const payload = buildPatientPayload(form)
      await updatePatient(id, payload)
      const fresh = await getPatient(id)
      setPatient(fresh)
      const f = patientToForm(fresh)
      setForm(f)
      setBaseline(f)
      showToast(`Patient "${fullName(fresh)}" updated successfully.`)
      return true
    } catch (err) {
      if (err.fields) {
        const mapped = {}
        for (const [key, msgs] of Object.entries(err.fields))
          mapped[normalizeFieldKey(key)] = Array.isArray(msgs) ? msgs[0] : String(msgs)
        setErrors(mapped)
        setFormError('Please fix the highlighted fields.')
      } else {
        setFormError(err.message)
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    setForm(baseline)
    setErrors({})
    setFormError(null)
  }

  const handleSaveSubmit = (e) => {
    e.preventDefault()
    saveChanges()
  }

  const switchSection = (key) => {
    if (key === section) return
    runGuarded(() => setSection(key))
  }

  useUnsavedChangesGuard({ isDirty: dirty, onSave: saveChanges, onDiscard: discardChanges })

  if (loading) return <Spinner />
  if (!patient) return <p className="text-gray-500">Patient not found.</p>

  const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
  const pendingBilled = invoices.filter(i => i.statusDisplay === 'Pending').reduce((s, i) => s + Number(i.totalAmount), 0)

  const now = new Date()
  const nextAppointment = appointments
    .filter(a => new Date(a.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0]
  const lastVisit = appointments
    .filter(a => new Date(a.scheduledAt) < now)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))[0]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{fullName(patient)}</h3>
          <p className="text-gray-500 text-sm mt-1 font-mono" title={patient.id}>
            {patient.patientNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-danger" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => switchSection(s.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              section === s.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'summary' && (
        <div className="space-y-4">
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="Age" value={`${ageFromDob(patient.dateOfBirth)} yrs`} />
            <Field label="Gender" value={patient.genderDisplay} />
            <Field label="Blood Group" value={patient.bloodGroupDisplay} />
            <Field label="Mobile" value={`${patient.countryCode} ${patient.phoneNumber}`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Appointments" value={appointments.length} />
            <StatTile
              label="Total Billed"
              value={`₹${totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
              sub={pendingBilled > 0 ? `₹${pendingBilled.toLocaleString('en-IN', { minimumFractionDigits: 0 })} pending` : undefined}
            />
            <StatTile
              label="Last Visit"
              value={lastVisit ? format(new Date(lastVisit.scheduledAt), 'd MMM yyyy') : '—'}
              sub={lastVisit?.doctorName}
            />
            <StatTile
              label="Next Appointment"
              value={nextAppointment ? format(new Date(nextAppointment.scheduledAt), 'd MMM yyyy') : '—'}
              sub={nextAppointment?.doctorName}
            />
          </div>
        </div>
      )}

      {section === 'demographic' && (
        (gLoading || bgLoading) ? (
          <div className="card"><Spinner /></div>
        ) : (
          <form onSubmit={handleSaveSubmit} noValidate className="card space-y-5">
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <PatientFormFields form={form} errors={errors} set={set} genders={genders} bloodGroups={bloodGroups} />
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-primary" type="submit" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save'}</button>
              <button className="btn-secondary" type="button" onClick={discardChanges} disabled={saving || !dirty}>
                Discard changes
              </button>
              {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
            </div>
          </form>
        )
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Appointments ({appointments.length})</h4>
          <Link to={`/app/appointments/new?patientId=${id}`} className="btn-primary text-xs">+ Book</Link>
        </div>
        {appointments.length === 0 ? <p className="text-gray-400 text-sm">No appointments.</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Doctor</th>
                <th className="pb-2 font-medium">Date & Time</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Vitals</th>
                <th className="pb-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map(a => (
                <tr key={a.id}>
                  <td className="py-2">{a.doctorName}</td>
                  <td className="py-2 text-gray-600">{format(new Date(a.scheduledAt), 'd MMM yyyy, h:mm a')}</td>
                  <td className="py-2">
                    <span className={badgeClass(a.statusDisplay)}>{a.statusDisplay}</span>
                  </td>
                  <td className="py-2">
                    {a.hasVitals
                      ? <span className="text-xs text-emerald-600 font-medium">Recorded</span>
                      : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="py-2 text-gray-600">{a.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold">Invoices ({invoices.length})</h4>
            {invoices.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Total billed: ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <Link to={`/app/billing/new?patientId=${id}`} className="btn-primary text-xs">+ Invoice</Link>
        </div>
        {invoices.length === 0 ? <p className="text-gray-400 text-sm">No invoices.</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(i => (
                <tr key={i.id}>
                  <td className="py-2">{i.description ?? `${i.items?.length ?? 0} item(s)`}</td>
                  <td className="py-2 font-medium">
                    ₹{Number(i.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2">
                    <span className={badgeClass(i.statusDisplay)}>{i.statusDisplay}</span>
                  </td>
                  <td className="py-2 text-gray-600">{format(new Date(i.issuedAt), 'd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDelete && (
        <ConfirmModal
          message={`Delete patient "${fullName(patient)}"? All related data will be removed.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {deleteError && (
        <ErrorModal title="Delete Failed" message={deleteError} onClose={() => setDeleteError(null)} />
      )}
    </div>
  )
}
