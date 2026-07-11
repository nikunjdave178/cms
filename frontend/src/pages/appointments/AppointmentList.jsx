import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAppointments, updateAppointment, deleteAppointment } from '../../api/appointments'
import { useStaticValues } from '../../hooks/useStaticValues'
import { format } from 'date-fns'
import Spinner from '../../components/Spinner'
import ConfirmModal from '../../components/ConfirmModal'
import Select from '../../components/Select'
import Pagination from '../../components/Pagination'

const statusColors = {
  Scheduled: 'badge bg-indigo-100 text-indigo-700',
  Completed: 'badge bg-emerald-100 text-emerald-700',
  Cancelled: 'badge bg-red-100 text-red-700',
  'No Show': 'badge bg-slate-100 text-slate-600',
}

export default function AppointmentList() {
  const { values: statuses } = useStaticValues('APPOINTMENT_STATUS')

  const [appointments, setAppointments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = () => {
    setLoading(true)
    getAppointments({ statusId: statusFilter || undefined, page, pageSize })
      .then(res => { setAppointments(res.items); setTotalCount(res.totalCount) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, page, pageSize])

  const handleStatusFilterChange = (v) => {
    setStatusFilter(v)
    setPage(1)
  }

  const handleStatusChange = async (appt, newStatusId) => {
    await updateAppointment(appt.id, {
      scheduledAt: appt.scheduledAt,
      statusId: Number(newStatusId),
      reason: appt.reason,
      notes: appt.notes,
    })
    load()
  }

  const handleDelete = async () => {
    await deleteAppointment(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          className="w-48"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          options={[
            { value: '', label: 'All Statuses' },
            ...statuses.map(s => ({ value: String(s.id), label: s.displayValue })),
          ]}
        />
        <div className="flex-1" />
        <Link to="/app/appointments/new" className="btn-primary">+ New Appointment</Link>
      </div>

      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Patient', 'Doctor', 'Specialisation', 'Date & Time', 'Reason', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide first:rounded-tl-xl last:rounded-tr-xl">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No appointments found.</td></tr>
              ) : appointments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/app/patients/${a.patientId}`} className="text-indigo-600 hover:underline">{a.patientName}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.doctorName}</td>
                  <td className="px-4 py-3 text-gray-500">{a.doctorSpecialization}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {format(new Date(a.scheduledAt), 'd MMM yyyy')}<br />
                    <span className="text-xs text-gray-400">{format(new Date(a.scheduledAt), 'h:mm a')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{a.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Select
                      size="sm"
                      className="w-28"
                      value={String(a.statusId)}
                      onChange={v => handleStatusChange(a, v)}
                      options={statuses.map(s => ({ value: String(s.id), label: s.displayValue }))}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/app/appointments/${a.id}/edit`} className="btn-secondary text-xs mr-2">Edit</Link>
                    <button className="btn-danger text-xs" onClick={() => setDeleteTarget(a)}>Delete</button>
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

      {deleteTarget && (
        <ConfirmModal
          message={`Delete appointment for "${deleteTarget.patientName}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
