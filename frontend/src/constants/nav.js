import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  Stethoscope,
  BarChart3,
  UserCog,
  Hash,
} from 'lucide-react'

export const NAV_GROUPS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, quickAccess: true },
      { path: '/patients', label: 'Patients', icon: Users, quickAccess: true },
      { path: '/appointments', label: 'Appointments', icon: CalendarDays, quickAccess: true },
      { path: '/billing', label: 'Billing', icon: Receipt, quickAccess: true },
      { path: '/doctors', label: 'Doctors', icon: Stethoscope },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    roles: ['Admin'],
    items: [
      { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['Admin'] },
      { path: '/users', label: 'Users', icon: UserCog, roles: ['Admin'] },
      { path: '/settings/numbering', label: 'Numbering', icon: Hash, roles: ['Admin'] },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

export const QUICK_ACCESS_ITEMS = NAV_ITEMS.filter((i) => i.quickAccess)

// Longest-prefix match against a pathname, used to seed a tab's fallback title.
export function matchNavItem(pathname) {
  return NAV_ITEMS
    .filter((i) => (i.path === '/' ? pathname === '/' : pathname === i.path || pathname.startsWith(i.path + '/')))
    .sort((a, b) => b.path.length - a.path.length)[0]
}
