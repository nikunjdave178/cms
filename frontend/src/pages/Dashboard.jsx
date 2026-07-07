import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../api/dashboard'
import { getRevenue, getAppointmentsByStatus } from '../api/reports'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import Spinner from '../components/Spinner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const STAT_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b']

const PIE_COLORS = { Scheduled: '#6366f1', Completed: '#10b981', Cancelled: '#ef4444', 'No Show': '#94a3b8' }

const statusBadge = {
  Scheduled: 'bg-indigo-100 text-indigo-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
  'No Show': 'bg-slate-100 text-slate-600',
}

const inr = (v) => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function StatCard({ label, value, sub, color, to }) {
  return (
    <Link to={to} className={`card border-l-4 hover:shadow-lg transition-shadow ${color} block`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1 text-gray-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Link>
  )
}

export default function Dashboard() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('Admin')

  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, todayAppointments: 0, pendingInvoices: 0, monthRevenue: 0, recentAppointments: [] })
  const [revenue, setRevenue] = useState([])
  const [apptStatus, setApptStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const calls = isAdmin
      ? Promise.all([getDashboardStats(), getRevenue(6), getAppointmentsByStatus()])
      : Promise.all([getDashboardStats()])

    calls.then(([s, r, a]) => {
      setStats(s)
      if (isAdmin) {
        setRevenue(r)
        setApptStatus(a)
      }
    }).catch(e => setError(e.message))
    .finally(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <Spinner />

  return (
    <>
    {error && (
      <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        Could not load dashboard data — {error}
      </div>
    )}
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={stats.totalPatients} color="border-indigo-500" to="/patients" />
        <StatCard label="Doctors" value={stats.totalDoctors} color="border-violet-500" to="/doctors" />
        <StatCard label="Today's Appointments" value={stats.todayAppointments} color="border-emerald-500" to="/appointments" />
        <StatCard
          label="Revenue This Month"
          value={inr(stats.monthRevenue)}
          sub={`${stats.pendingInvoices} invoice${stats.pendingInvoices !== 1 ? 's' : ''} pending`}
          color="border-amber-500"
          to="/billing"
        />
      </div>

      {/* Charts row (Admin only — backed by report endpoints scoped to Admin) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue trend */}
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Revenue — Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Appointments by status */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Appointments by Status</h3>
            {apptStatus.length === 0 ? (
              <p className="text-sm text-gray-400 mt-8 text-center">No appointments yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={apptStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="count" nameKey="status" paddingAngle={3}>
                    {apptStatus.map((entry) => (
                      <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Recent appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Appointments</h3>
          <Link to="/appointments" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        {stats.recentAppointments.length === 0 ? (
          <p className="text-gray-400 text-sm">No appointments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 uppercase tracking-wide">
                <th className="pb-2 font-medium">Patient</th>
                <th className="pb-2 font-medium">Doctor</th>
                <th className="pb-2 font-medium">Date & Time</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentAppointments.map(a => (
                <tr key={a.id}>
                  <td className="py-2.5 font-medium">{a.patientName}</td>
                  <td className="py-2.5 text-gray-600">{a.doctorName}</td>
                  <td className="py-2.5 text-gray-600">
                    {format(new Date(a.scheduledAt), 'd MMM yyyy, h:mm a')}
                  </td>
                  <td className="py-2.5">
                    <span className={`badge ${statusBadge[a.statusDisplay] ?? 'bg-gray-100 text-gray-700'}`}>
                      {a.statusDisplay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </>
  )
}
