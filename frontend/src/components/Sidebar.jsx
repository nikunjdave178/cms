import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  {
    to: '/', label: 'Dashboard',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  },
  {
    to: '/patients', label: 'Patients',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  },
  {
    to: '/appointments', label: 'Appointments',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  },
  {
    to: '/billing', label: 'Billing',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  },
  {
    to: '/doctors', label: 'Doctors',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  },
  {
    to: '/reports', label: 'Reports', roles: ['Admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  },
  {
    to: '/users', label: 'Users', roles: ['Admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  },
  {
    to: '/settings/numbering', label: 'Numbering', roles: ['Admin'],
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h13.5m-13.5 7.5h13.5m-9-15L7.5 19.5m6-16.5L10.5 19.5" />
  },
]

function Icon({ children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {children}
    </svg>
  )
}

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const visibleLinks = links.filter(l => !l.roles || hasRole(...l.roles))

  return (
    <aside className="w-60 h-full shrink-0 bg-slate-900 text-white flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">C</div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight leading-none">ClinicMS</h1>
            <p className="text-xs text-slate-400 mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon>{icon}</Icon>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 px-6 py-4 border-t border-slate-700/60">
        <p className="text-sm font-medium text-slate-200 truncate">{user?.fullName}</p>
        <p className="text-xs text-slate-500">{user?.role}</p>
        <button
          onClick={logout}
          className="mt-3 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
