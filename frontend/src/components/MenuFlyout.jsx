import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import { useUnsavedChanges } from '../context/UnsavedChangesContext'
import { NAV_GROUPS } from '../constants/nav'

// Attached to the rail's right edge, opened on hover (see Rail.jsx) — not a
// backdrop modal, so no portal: it closes on mouse-out (parent tracks the hover
// zone) or immediately once an item is clicked, via onNavigate.
export default function MenuFlyout({ left, onNavigate }) {
  const { hasRole } = useAuth()
  const { activeTabPath } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const { runGuarded } = useUnsavedChanges()

  // Intercepts the NavLink click instead of letting it navigate natively, so an
  // unsaved-changes prompt (see context/UnsavedChangesContext.jsx) can block it.
  // Re-clicking the already-active route skips the guard — it's a resync, not a
  // navigation away from anything.
  const handleItemClick = (path) => (e) => {
    e.preventDefault()
    onNavigate?.()
    if (path === location.pathname) {
      navigate(path)
      return
    }
    runGuarded(() => navigate(path))
  }

  const visibleGroups = NAV_GROUPS
    .filter((g) => !g.roles || hasRole(...g.roles))
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || hasRole(...i.roles)) }))
    .filter((g) => g.items.length > 0)

  return (
    <div
      data-testid="menu-flyout"
      className="absolute top-0 z-40 w-64 max-h-full overflow-y-auto rounded-r-xl border border-l-0 border-gray-200 bg-white py-3 shadow-2xl"
      style={{ left }}
    >
      {visibleGroups.map((group, i) => (
        <div key={group.id} className={i > 0 ? 'mt-4' : ''}>
          <h4 className="px-4 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</h4>
          <div className="px-2 space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={handleItemClick(item.path)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive && activeTabPath ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
