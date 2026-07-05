import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInvoices, updateInvoiceStatus, deleteInvoice } from '../../api/billing'
import { useStaticValues } from '../../hooks/useStaticValues'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'

const statusColors = {
  Pending: 'badge bg-yellow-100 text-yellow-800',
  Paid: 'badge bg-green-100 text-green-800',
  Cancelled: 'badge bg-red-100 text-red-800',
}

const inr = (val) =>
  '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function InvoiceList() {
  const { values: invoiceStatuses } = useStaticValues('INVOICE_STATUS')
  const { values: paymentModes } = useStaticValues('PAYMENT_MODE')

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [markPaidTarget, setMarkPaidTarget] = useState(null)
  const [paymentModeId, setPaymentModeId] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = (statusId) => {
    setLoading(true)
    getInvoices(statusId ? { statusId } : {})
      .then(setInvoices)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load('') }, [])

  const handleMarkPaid = async () => {
    const paidId = invoiceStatuses.find(s => s.code === 'PAID')?.id
    if (!paidId) return
    await updateInvoiceStatus(
      markPaidTarget.id, paidId,
      paymentModeId ? Number(paymentModeId) : null,
      paymentReference || null
    )
    setMarkPaidTarget(null)
    setPaymentModeId('')
    setPaymentReference('')
    load(statusFilter)
  }

  const handleDelete = async () => {
    await deleteInvoice(deleteTarget.id)
    setDeleteTarget(null)
    load(statusFilter)
  }

  const total = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
  const paid = invoices.filter(i => i.statusDisplay === 'Paid').reduce((s, i) => s + Number(i.totalAmount), 0)
  const pending = invoices.filter(i => i.statusDisplay === 'Pending').reduce((s, i) => s + Number(i.totalAmount), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: total, color: 'text-gray-800' },
          { label: 'Collected', value: paid, color: 'text-green-600' },
          { label: 'Pending', value: pending, color: 'text-yellow-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{inr(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select
          className="input w-48"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); load(e.target.value) }}
        >
          <option value="">All Statuses</option>
          {invoiceStatuses.map(s => <option key={s.id} value={s.id}>{s.displayValue}</option>)}
        </select>
        <div className="flex-1" />
        <Link to="/billing/new" className="btn-primary">+ New Invoice</Link>
      </div>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Patient', 'Description', 'Subtotal', 'GST', 'Total', 'Status', 'Issued', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No invoices found.</td></tr>
              ) : invoices.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{i.id}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/patients/${i.patientId}`} className="text-indigo-600 hover:underline">{i.patientName}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{i.description ?? '—'}</td>
                  <td className="px-4 py-3">{inr(i.subtotalAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{i.gstRate ? `${i.gstRate}%` : '—'}</td>
                  <td className="px-4 py-3 font-semibold">{inr(i.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={statusColors[i.statusDisplay] ?? 'badge bg-gray-100 text-gray-700'}>{i.statusDisplay}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(i.issuedAt), 'd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {i.statusDisplay === 'Pending' && (
                      <button className="btn-primary text-xs" onClick={() => setMarkPaidTarget(i)}>Mark Paid</button>
                    )}
                    <button className="btn-danger text-xs" onClick={() => setDeleteTarget(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Paid modal */}
      {markPaidTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 space-y-4">
            <h3 className="font-semibold text-gray-800">Mark Invoice #{markPaidTarget.id} as Paid</h3>
            <p className="text-sm text-gray-500">Total: {inr(markPaidTarget.totalAmount)}</p>
            <div>
              <label className="label">Payment Mode</label>
              <select className="input" value={paymentModeId} onChange={e => setPaymentModeId(e.target.value)}>
                <option value="">Select…</option>
                {paymentModes.map(m => <option key={m.id} value={m.id}>{m.displayValue}</option>)}
              </select>
            </div>
            {paymentModeId && (
              <div>
                <label className="label">Reference / Txn ID</label>
                <input className="input" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Optional" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button className="btn-primary" onClick={handleMarkPaid}>Confirm Paid</button>
              <button className="btn-secondary" onClick={() => setMarkPaidTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete invoice #${deleteTarget.id} for "${deleteTarget.patientName}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
