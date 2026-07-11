import { Outlet } from 'react-router-dom'
import Rail from './Rail'
import TabBar from './TabBar'
import { useLayout } from '../context/LayoutContext'

export default function Layout() {
  const { railState, restoreRail } = useLayout()

  return (
    <div className="flex h-screen overflow-hidden">
      {railState !== 'hidden' && <Rail />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TabBar showRestoreRail={railState === 'hidden'} onRestoreRail={restoreRail} />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
