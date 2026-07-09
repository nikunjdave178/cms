import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  getAppointment, createAppointment, updateAppointment,
  getAppointmentVitals, createVitals, updateVitals
} from '../../api/appointments'
import { getPatients } from '../../api/patients'
import { getDoctors } from '../../api/doctors'
import { useStaticValues } from '../../hooks/useStaticValues'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import Select from '../../components/Select'
import { fullName, doctorName } from '../../utils/format'

const toLocalDateTimeInput = (iso) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm")

const emptyVitals = {
  bloodPressureSystolic: '', bloodPressureDiastolic: '', pulseRate: '',
  temperature: '', weightKg: '', heightCm: '', oxygenSaturation: '', notes: ''
}

export default function AppointmentForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { values: statuses } = useStaticValues('APPOINTMENT_STATUS')

  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [form, setForm] = useState({
    patientId: searchParams.get('patientId') ?? '',
    doctorId: '',
    scheduledAt: '',
    statusId: '',
    reason: '',
    notes: '',
  })
  const [vitals, setVitals] = useState(emptyVitals)
  const [hasExistingVitals, setHasExistingVitals] = useState(false)
  const [showVitals, setShowVitals] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const promises = [getPatients(), getDoctors()]
    if (isEdit) promises.push(getAppointment(id))

    Promise.all(promises).then(([pts, docs, appt]) => {
      setPatients(pts)
      setDoctors(docs)
      if (appt) {
        setForm({
          patientId: String(appt.patientId),
          doctorId: String(appt.doctorId),
          scheduledAt: toLocalDateTimeInput(appt.scheduledAt),
          statusId: String(appt.statusId),
          reason: appt.reason ?? '',
          notes: appt.notes ?? '',
        })
        if (appt.hasVitals) {
          setHasExistingVitals(true)
          return getAppointmentVitals(id).then(v => {
            setVitals({
              bloodPressureSystolic: v.bloodPressureSystolic ?? '',
              bloodPressureDiastolic: v.bloodPressureDiastolic ?? '',
              pulseRate: v.pulseRate ?? '',
              temperature: v.temperature ?? '',
              weightKg: v.weightKg ?? '',
              heightCm: v.heightCm ?? '',
              oxygenSaturation: v.oxygenSaturation ?? '',
              notes: v.notes ?? '',
            })
            setShowVitals(true)
          }).catch(() => {})
        }
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [id, isEdit])

  // Set default statusId once loaded
  useEffect(() => {
    if (!form.statusId && statuses.length > 0)
      setForm(f => ({ ...f, statusId: String(statuses[0].id) }))
  }, [statuses])

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e?.target ? e.target.value : e }))
  const setV = (field) => (e) => setVitals(v => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.patientId) { setError('Please select a patient.'); return }
    if (!form.doctorId) { setError('Please select a doctor.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        patientId: form.patientId,
        doctorId: form.doctorId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        reason: form.reason || null,
        notes: form.notes || null,
      }

      let apptId = id
      if (isEdit) {
        await updateAppointment(id, { ...payload, statusId: Number(form.statusId) })
      } else {
        const created = await createAppointment(payload)
        apptId = created.id
      }

      // Save vitals if section is open and any field is filled
      const vitalsPayload = {
        bloodPressureSystolic: vitals.bloodPressureSystolic ? Number(vitals.bloodPressureSystolic) : null,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic ? Number(vitals.bloodPressureDiastolic) : null,
        pulseRate: vitals.pulseRate ? Number(vitals.pulseRate) : null,
        temperature: vitals.temperature ? Number(vitals.temperature) : null,
        weightKg: vitals.weightKg ? Number(vitals.weightKg) : null,
        heightCm: vitals.heightCm ? Number(vitals.heightCm) : null,
        oxygenSaturation: vitals.oxygenSaturation ? Number(vitals.oxygenSaturation) : null,
        notes: vitals.notes || null,
      }
      const hasVitalsData = Object.values(vitalsPayload).some(v => v !== null)
      if (showVitals && hasVitalsData) {
        if (hasExistingVitals) await updateVitals(apptId, vitalsPayload)
        else await createVitals(apptId, vitalsPayload)
      }

      navigate('/appointments')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-xl">
      <h3 className="text-lg font-semibold mb-6">{isEdit ? 'Edit Appointment' : 'Book New Appointment'}</h3>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-5">
          <div>
            <label className="label">Patient *</label>
            <Select
              value={form.patientId}
              onChange={set('patientId')}
              searchable
              placeholder="Select patient…"
              options={patients.map(p => ({
                value: p.id,
                label: `${p.patientNumber} — ${fullName(p)}`,
                sublabel: `${p.countryCode} ${p.phoneNumber}`,
              }))}
            />
          </div>

          <div>
            <label className="label">Doctor *</label>
            <Select
              value={form.doctorId}
              onChange={set('doctorId')}
              searchable
              placeholder="Select doctor…"
              options={doctors.map(d => ({
                value: d.id,
                label: doctorName(d),
                sublabel: d.specialization,
              }))}
            />
          </div>

          <div>
            <label className="label">Date & Time *</label>
            <input className="input" type="datetime-local" required value={form.scheduledAt} onChange={set('scheduledAt')} />
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <Select
                value={form.statusId}
                onChange={set('statusId')}
                options={statuses.map(s => ({ value: String(s.id), label: s.displayValue }))}
              />
            </div>
          )}

          <div>
            <label className="label">Reason for Visit</label>
            <input className="input" value={form.reason} onChange={set('reason')} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {/* Vitals section */}
        <div className="card">
          <button
            type="button"
            onClick={() => setShowVitals(v => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="font-medium text-sm text-gray-700">Patient Vitals (optional)</span>
            <span className="text-gray-400 text-xs">{showVitals ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showVitals && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">BP Systolic (mmHg)</label>
                  <input className="input" type="number" step="0.1" value={vitals.bloodPressureSystolic} onChange={setV('bloodPressureSystolic')} placeholder="120" />
                </div>
                <div>
                  <label className="label">BP Diastolic (mmHg)</label>
                  <input className="input" type="number" step="0.1" value={vitals.bloodPressureDiastolic} onChange={setV('bloodPressureDiastolic')} placeholder="80" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Pulse (bpm)</label>
                  <input className="input" type="number" step="0.1" value={vitals.pulseRate} onChange={setV('pulseRate')} placeholder="72" />
                </div>
                <div>
                  <label className="label">Temp (°C)</label>
                  <input className="input" type="number" step="0.1" value={vitals.temperature} onChange={setV('temperature')} placeholder="37.0" />
                </div>
                <div>
                  <label className="label">SpO₂ (%)</label>
                  <input className="input" type="number" step="0.1" value={vitals.oxygenSaturation} onChange={setV('oxygenSaturation')} placeholder="98" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Weight (kg)</label>
                  <input className="input" type="number" step="0.1" value={vitals.weightKg} onChange={setV('weightKg')} placeholder="65.0" />
                </div>
                <div>
                  <label className="label">Height (cm)</label>
                  <input className="input" type="number" step="0.1" value={vitals.heightCm} onChange={setV('heightCm')} placeholder="170" />
                </div>
              </div>
              <div>
                <label className="label">Vitals Notes</label>
                <textarea className="input resize-none" rows={2} value={vitals.notes} onChange={setV('notes')} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Book Appointment'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/appointments')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
