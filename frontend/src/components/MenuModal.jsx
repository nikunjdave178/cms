import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_GROUPS } from '../constants/nav'
import Modal from './Modal'

export default function MenuModal({ onClose }) {
  const { hasRole } = useAuth()

  const visibleGroups = NAV_GROUPS
    .filter((g) => !g.roles || hasRole(...g.roles))
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || hasRole(...i.roles)) }))
    .filter((g) => g.items.length > 0)

  return (
    <Modal onClose={onClose} title="Menu" size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {visibleGroups.map((group) => (
          <div key={group.id}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{group.label}</h4>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
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
    </Modal>
  )
}
