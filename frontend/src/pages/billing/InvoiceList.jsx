import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInvoices, updateInvoiceStatus, deleteInvoice, getBillingSummary } from '../../api/billing'
import { useStaticValues } from '../../hooks/useStaticValues'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'
import Select from '../../components/Select'
import Pagination from '../../components/Pagination'
import { inr } from '../../utils/format'
import { badgeClass } from '../../constants/status'

export default function InvoiceList() {
  const { hasRole } = useAuth()
  const canEdit = hasRole('Admin', 'Receptionist')
  const { values: invoiceStatuses } = useStaticValues('INVOICE_STATUS')
  const { values: paymentModes } = useStaticValues('PAYMENT_MODE')

  const [invoices, setInvoices] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState({ totalBilled: 0, totalRevenue: 0, pendingAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [markPaidTarget, setMarkPaidTarget] = useState(null)
  const [paymentModeId, setPaymentModeId] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = () => {
    setLoading(true)
    getInvoices({ statusId: statusFilter || undefined, page, pageSize })
      .then(res => { setInvoices(res.items); setTotalCount(res.totalCount) })
      .finally(() => setLoading(false))
    getBillingSummary().then(setSummary)
  }

  useEffect(() => { load() }, [statusFilter, page, pageSize])

  const handleStatusFilterChange = (v) => {
    setStatusFilter(v)
    setPage(1)
  }

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
    load()
  }

  const handleDelete = async () => {
    await deleteInvoice(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const total = summary.totalBilled
  const paid = summary.totalRevenue
  const pending = summary.pendingAmount

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: total, color: 'text-gray-800' },
          { label: 'Collected', value: paid, color: 'text-success-600' },
          { label: 'Pending', value: pending, color: 'text-warning-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{inr(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select
          className="w-48"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          options={[
            { value: '', label: 'All Statuses' },
            ...invoiceStatuses.map(s => ({ value: String(s.id), label: s.displayValue })),
          ]}
        />
        <div className="flex-1" />
        {canEdit && <Link to="/billing/new" className="btn-primary">+ New Invoice</Link>}
      </div>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Invoice No.', 'Patient', 'Description', 'Subtotal', 'GST', 'Total', 'Status', 'Issued', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No invoices found.</td></tr>
              ) : invoices.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs" title={i.id}>{i.invoiceNumber}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/patients/${i.patientId}`} className="text-primary-600 hover:underline">{i.patientName}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{i.description ?? '—'}</td>
                  <td className="px-4 py-3">{inr(i.subtotalAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{i.gstRate ? `${i.gstRate}%` : '—'}</td>
                  <td className="px-4 py-3 font-semibold">{inr(i.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={badgeClass(i.statusDisplay)}>{i.statusDisplay}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(i.issuedAt), 'd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {canEdit && <>
                      {i.statusDisplay === 'Pending' && (
                        <button className="btn-primary text-xs" onClick={() => setMarkPaidTarget(i)}>Mark Paid</button>
                      )}
                      <button className="btn-danger text-xs" onClick={() => setDeleteTarget(i)}>Delete</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1) }}
          />
        </div>
      )}

      {/* Mark Paid modal */}
      {markPaidTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 space-y-4">
            <h3 className="font-semibold text-gray-800">Mark Invoice {markPaidTarget.invoiceNumber} as Paid</h3>
            <p className="text-sm text-gray-500">Total: {inr(markPaidTarget.totalAmount)}</p>
            <div>
              <label className="label">Payment Mode</label>
              <Select
                value={paymentModeId}
                onChange={setPaymentModeId}
                placeholder="Select…"
                options={paymentModes.map(m => ({ value: String(m.id), label: m.displayValue }))}
              />
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
