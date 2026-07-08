import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createInvoice } from '../../api/billing'
import { getPatients } from '../../api/patients'
import { getAppointments } from '../../api/appointments'
import { useStaticValues } from '../../hooks/useStaticValues'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import Select from '../../components/Select'

const fullName = (p) => [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
const inr = (v) => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const emptyItem = () => ({ description: '', quantity: '1', unitPrice: '' })

const GST_RATES = ['', '5', '12', '18', '28']

export default function InvoiceForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { values: paymentModes } = useStaticValues('PAYMENT_MODE')

  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [form, setForm] = useState({
    patientId: searchParams.get('patientId') ?? '',
    appointmentId: '',
    description: '',
    gstRate: '',
    paymentModeId: '',
    paymentReference: '',
  })
  const [items, setItems] = useState([emptyItem()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPatients().then(setPatients).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.patientId) { setAppointments([]); return }
    getAppointments({ patientId: form.patientId })
      .then(setAppointments)
      .catch(() => setAppointments([]))
  }, [form.patientId])

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e?.target ? e.target.value : e }))

  const addItem = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))
  const setItemField = (idx, field) => (e) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: e.target.value } : item))

  const subtotal = items.reduce((sum, item) =>
    sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0)
  const gstAmount = form.gstRate ? Math.round(subtotal * Number(form.gstRate) / 100 * 100) / 100 : 0
  const total = subtotal + gstAmount

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!form.patientId) throw new Error('Please select a patient.')
      const validItems = items.filter(i => i.description && Number(i.unitPrice) > 0)
      if (validItems.length === 0) throw new Error('Add at least one item with a price.')

      await createInvoice({
        patientId: form.patientId,
        appointmentId: form.appointmentId || null,
        description: form.description || null,
        items: validItems.map(i => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice),
        })),
        gstRate: form.gstRate ? Number(form.gstRate) : null,
        paymentModeId: form.paymentModeId ? Number(form.paymentModeId) : null,
        paymentReference: form.paymentReference || null,
      })
      navigate('/billing')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-6">Create Invoice</h3>
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
                label: fullName(p),
                sublabel: `${p.countryCode} ${p.phoneNumber}`,
              }))}
            />
          </div>

          <div>
            <label className="label">Linked Appointment (optional)</label>
            <Select
              value={form.appointmentId}
              onChange={set('appointmentId')}
              disabled={!form.patientId}
              options={[
                { value: '', label: 'None' },
                ...appointments.map(a => ({
                  value: a.id,
                  label: `${a.doctorName} — ${format(new Date(a.scheduledAt), 'd MMM yyyy')}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="label">Invoice Description (optional)</label>
            <input className="input" value={form.description} onChange={set('description')} placeholder="e.g. Consultation + Lab Tests" />
          </div>
        </div>

        {/* Line items */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-gray-700">Line Items</h4>
            <button type="button" onClick={addItem} className="btn-secondary text-xs">+ Add Row</button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="input col-span-6 text-sm"
                  placeholder="Description"
                  value={item.description}
                  onChange={setItemField(idx, 'description')}
                />
                <input
                  className="input col-span-2 text-sm text-center"
                  type="number" min="1" step="1"
                  value={item.quantity}
                  onChange={setItemField(idx, 'quantity')}
                />
                <input
                  className="input col-span-2 text-sm text-right"
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={item.unitPrice}
                  onChange={setItemField(idx, 'unitPrice')}
                />
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <span className="text-sm text-gray-600">
                    {inr((Number(item.quantity) * Number(item.unitPrice)) || 0)}
                  </span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="label mb-0">GST %</label>
                <Select
                  className="w-28"
                  value={form.gstRate}
                  onChange={set('gstRate')}
                  options={GST_RATES.map(r => ({ value: r, label: r ? `${r}%` : 'No GST' }))}
                />
              </div>
              <div className="text-right text-sm space-y-1">
                <div className="text-gray-500">Subtotal: <span className="font-medium text-gray-800">{inr(subtotal)}</span></div>
                {gstAmount > 0 && <div className="text-gray-500">GST ({form.gstRate}%): <span className="font-medium text-gray-800">{inr(gstAmount)}</span></div>}
                <div className="text-base font-bold text-gray-900">Total: {inr(total)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card space-y-4">
          <h4 className="font-medium text-sm text-gray-700">Payment Details (optional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Mode</label>
              <Select
                value={form.paymentModeId}
                onChange={set('paymentModeId')}
                options={[
                  { value: '', label: 'None' },
                  ...paymentModes.map(m => ({ value: String(m.id), label: m.displayValue })),
                ]}
              />
            </div>
            {form.paymentModeId && (
              <div>
                <label className="label">Reference / Txn ID</label>
                <input className="input" value={form.paymentReference} onChange={set('paymentReference')} placeholder="UPI ID, last 4 digits, etc." />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create Invoice'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/billing')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
