import { useEffect, useState } from 'react'
import { getRevenue, getAppointmentsByStatus, getPatientGrowth, getPaymentModes } from '../api/reports'
import Spinner from '../components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

const PIE_COLORS = ['#6366f1', '#10b981', '#ef4444', '#94a3b8', '#f59e0b']
const inr = (v) => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function SectionCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4 text-sm">{title}</h3>
      {children}
    </div>
  )
}

export default function Reports() {
  const [months, setMonths] = useState(6)
  const [revenue, setRevenue] = useState([])
  const [apptStatus, setApptStatus] = useState([])
  const [patientGrowth, setPatientGrowth] = useState([])
  const [paymentModes, setPaymentModes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = (m) => {
    setLoading(true)
    Promise.all([
      getRevenue(m),
      getAppointmentsByStatus(),
      getPatientGrowth(m),
      getPaymentModes(),
    ]).then(([r, a, pg, pm]) => {
      setRevenue(r)
      setApptStatus(a)
      setPatientGrowth(pg)
      setPaymentModes(pm)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load(months) }, [])

  const handleMonthChange = (m) => {
    setMonths(m)
    load(m)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Analytics & Reports</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Period:</span>
          {[3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => handleMonthChange(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                months === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Monthly Revenue (Paid Invoices)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [inr(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Appointments by Status">
            {apptStatus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={apptStatus} cx="50%" cy="50%" outerRadius={90}
                    dataKey="count" nameKey="status" paddingAngle={3}>
                    {apptStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, n) => [v + ' appointments', n]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="New Patients per Month">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={patientGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'New Patients']} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Revenue by Payment Mode">
            {paymentModes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No paid invoices yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={paymentModes} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="mode" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                    <Tooltip formatter={(v) => [inr(v), 'Amount']} />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {paymentModes.map((pm, i) => (
                    <div key={pm.paymentModeId} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {pm.mode}: {pm.count} txn{pm.count !== 1 ? 's' : ''}
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}
