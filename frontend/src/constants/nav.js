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

// Every module route lives under /app/* — nothing is routed at bare "/".
// MAIN_PATH is the deliberately blank landing route (no tab opens for it).
export const MAIN_PATH = '/app/main'
export const DASHBOARD_PATH = '/app/dashboard'

export const NAV_GROUPS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { path: DASHBOARD_PATH, label: 'Dashboard', icon: LayoutDashboard, quickAccess: true },
      { path: '/app/patients', label: 'Patients', icon: Users, quickAccess: true },
      { path: '/app/appointments', label: 'Appointments', icon: CalendarDays, quickAccess: true },
      { path: '/app/billing', label: 'Billing', icon: Receipt, quickAccess: true },
      { path: '/app/doctors', label: 'Doctors', icon: Stethoscope },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    roles: ['Admin'],
    items: [
      { path: '/app/reports', label: 'Reports', icon: BarChart3, roles: ['Admin'] },
      { path: '/app/users', label: 'Users', icon: UserCog, roles: ['Admin'] },
      { path: '/app/settings/numbering', label: 'Numbering', icon: Hash, roles: ['Admin'] },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

export const QUICK_ACCESS_ITEMS = NAV_ITEMS.filter((i) => i.quickAccess)

// Longest-prefix match against a pathname, used to seed a tab's fallback title.
export function matchNavItem(pathname) {
  return NAV_ITEMS
    .filter((i) => pathname === i.path || pathname.startsWith(i.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0]
}
