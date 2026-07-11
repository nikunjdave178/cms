import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutGrid, PanelLeftClose, PanelLeftOpen, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import { QUICK_ACCESS_ITEMS } from '../constants/nav'
import MenuModal from './MenuModal'

function RailButton({ icon: Icon, label, expanded, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      {expanded && <span className="truncate">{label}</span>}
      {!expanded && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
          {label}
        </span>
      )}
    </button>
  )
}

function RailLink({ to, end, icon: Icon, label, expanded }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      {expanded && <span className="truncate">{label}</span>}
      {!expanded && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
          {label}
        </span>
      )}
    </NavLink>
  )
}

export default function Rail() {
  const { user, logout } = useAuth()
  const { railState, toggleRail, hideRail } = useLayout()
  const [menuOpen, setMenuOpen] = useState(false)
  const expanded = railState === 'expanded'

  return (
    <aside
      className={`h-full shrink-0 bg-slate-900 text-white flex flex-col overflow-hidden transition-[width] duration-150 ${
        expanded ? 'w-60' : 'w-16'
      }`}
    >
      <div className="shrink-0 px-3 py-5 border-b border-slate-700/60">
        <div className={`flex items-center gap-2.5 ${expanded ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            C
          </div>
          {expanded && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight leading-none truncate">ClinicMS</h1>
              <p className="text-xs text-slate-400 mt-0.5 truncate">Management System</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5">
        <RailButton icon={LayoutGrid} label="Menu" expanded={expanded} onClick={() => setMenuOpen(true)} />
        <div className="pt-2 space-y-0.5">
          {QUICK_ACCESS_ITEMS.map((item) => (
            <RailLink key={item.path} to={item.path} end={item.end} icon={item.icon} label={item.label} expanded={expanded} />
          ))}
        </div>
      </nav>

      <div className="shrink-0 px-3 py-3 border-t border-slate-700/60 space-y-1">
        <RailButton
          icon={expanded ? PanelLeftClose : PanelLeftOpen}
          label={expanded ? 'Collapse' : 'Expand'}
          expanded={expanded}
          onClick={toggleRail}
        />
        <RailButton icon={EyeOff} label="Hide sidebar" expanded={expanded} onClick={hideRail} />
      </div>

      <div className={`shrink-0 px-3 py-4 border-t border-slate-700/60 ${expanded ? '' : 'flex flex-col items-center'}`}>
        {expanded ? (
          <>
            <p className="text-sm font-medium text-slate-200 truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
            <button onClick={logout} className="mt-3 text-xs font-medium text-slate-400 hover:text-white transition-colors">
              Log out
            </button>
          </>
        ) : (
          <button
            onClick={logout}
            title="Log out"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Log out
          </button>
        )}
      </div>

      {menuOpen && <MenuModal onClose={() => setMenuOpen(false)} />}
    </aside>
  )
}
