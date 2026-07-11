import { Outlet } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import Rail from './Rail'
import TabBar from './TabBar'
import EmptyState from './EmptyState'
import { useLayout } from '../context/LayoutContext'

export default function Layout() {
  const { activeTabPath } = useLayout()

  return (
    <div className="flex h-screen overflow-hidden">
      <Rail />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TabBar />
        <main className="flex-1 overflow-y-auto p-8">
          {activeTabPath ? (
            <Outlet />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="Nothing open"
              description="Pick something from the menu to get started."
            />
          )}
        </main>
      </div>
    </div>
  )
}
