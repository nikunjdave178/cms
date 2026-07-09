import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const titles = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/billing': 'Billing',
  '/doctors': 'Doctors',
  '/reports': 'Reports',
  '/users': 'Users',
}

export default function Layout() {
  const location = useLocation()
  const segment = '/' + location.pathname.split('/')[1]
  const title = titles[segment] ?? 'Clinic MS'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
