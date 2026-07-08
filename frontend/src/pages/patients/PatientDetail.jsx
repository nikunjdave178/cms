import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPatient, deletePatient } from '../../api/patients'
import { getAppointments } from '../../api/appointments'
import { getInvoices } from '../../api/billing'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'

const fullName = (p) => [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-gray-800">{value || '—'}</p>
    </div>
  )
}

const apptBadge = {
  Scheduled: 'badge bg-indigo-100 text-indigo-700',
  Completed: 'badge bg-emerald-100 text-emerald-700',
  Cancelled: 'badge bg-red-100 text-red-700',
  'No Show': 'badge bg-slate-100 text-slate-600',
}

const invBadge = {
  Pending: 'badge bg-yellow-100 text-yellow-800',
  Paid: 'badge bg-emerald-100 text-emerald-700',
  Cancelled: 'badge bg-red-100 text-red-700',
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    Promise.all([getPatient(id), getAppointments({ patientId: id }), getInvoices({ patientId: id })])
      .then(([p, a, inv]) => { setPatient(p); setAppointments(a); setInvoices(inv) })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    await deletePatient(id)
    navigate('/patients')
  }

  if (loading) return <Spinner />
  if (!patient) return <p className="text-gray-500">Patient not found.</p>

  const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
  const address = [patient.address, patient.city, patient.state, patient.pincode, patient.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{fullName(patient)}</h3>
          <p className="text-gray-500 text-sm mt-1 font-mono" title={patient.id}>
            Patient ID {String(patient.id).slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/patients/${id}/edit`} className="btn-secondary">Edit</Link>
          <button className="btn-danger" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-3 gap-5">
        <Field label="Date of Birth" value={format(new Date(patient.dateOfBirth), 'd MMM yyyy')} />
        <Field label="Gender" value={patient.genderDisplay} />
        <Field label="Blood Group" value={patient.bloodGroupDisplay} />
        <Field label="Mobile" value={`${patient.countryCode} ${patient.phoneNumber}`} />
        <Field label="Email" value={patient.email} />
        <Field label="Address" value={address} />
        {patient.notes && (
          <div className="col-span-full">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Medical Notes</p>
            <p className="mt-0.5 text-gray-800 whitespace-pre-line">{patient.notes}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Appointments ({appointments.length})</h4>
          <Link to={`/appointments/new?patientId=${id}`} className="btn-primary text-xs">+ Book</Link>
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
                    <span className={apptBadge[a.statusDisplay] ?? 'badge bg-gray-100 text-gray-600'}>{a.statusDisplay}</span>
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
          <Link to={`/billing/new?patientId=${id}`} className="btn-primary text-xs">+ Invoice</Link>
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
                    <span className={invBadge[i.statusDisplay] ?? 'badge bg-gray-100 text-gray-600'}>{i.statusDisplay}</span>
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
    </div>
  )
}
