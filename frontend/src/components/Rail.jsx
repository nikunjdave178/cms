import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu as MenuIcon } from 'lucide-react'
import { useLayout } from '../context/LayoutContext'
import { QUICK_ACCESS_ITEMS } from '../constants/nav'
import MenuFlyout from './MenuFlyout'

// Grace period between leaving the Menu row/flyout and actually closing it, so
// crossing the (small, unavoidable) gap between the two doesn't read as "left."
const MENU_CLOSE_DELAY_MS = 200

const DOCKED_WIDTH = 64
const PEEK_WIDTH = 240

function RailButton({ icon: Icon, label, showLabel }) {
  return (
    <div
      title={showLabel ? undefined : label}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-default"
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      {showLabel && <span className="truncate">{label}</span>}
    </div>
  )
}

function RailLink({ to, end, icon: Icon, label, showLabel, onClick, forceInactive }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={showLabel ? undefined : label}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive && !forceInactive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      {showLabel && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function Rail() {
  const { activeTabPath } = useLayout()
  const [peeking, setPeeking] = useState(false)
  const [menuHover, setMenuHover] = useState(false)
  const menuCloseTimer = useRef(null)

  const cancelMenuClose = () => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current)
      menuCloseTimer.current = null
    }
  }
  const openMenu = () => {
    cancelMenuClose()
    setMenuHover(true)
  }
  const scheduleMenuClose = () => {
    cancelMenuClose()
    menuCloseTimer.current = setTimeout(() => setMenuHover(false), MENU_CLOSE_DELAY_MS)
  }
  // If the user clicked something, they're done with the menu/sidebar — collapse
  // it immediately rather than waiting for a mouse-out that may not even happen
  // (e.g. the click itself can navigate the peeked content out from under the cursor).
  const closeMenu = () => {
    cancelMenuClose()
    setMenuHover(false)
    setPeeking(false)
  }

  useEffect(() => cancelMenuClose, [])

  return (
    <aside
      data-testid="rail"
      className="relative h-full shrink-0 w-16"
      onMouseEnter={() => setPeeking(true)}
      onMouseLeave={() => {
        setPeeking(false)
        cancelMenuClose()
        setMenuHover(false)
      }}
    >
      <div
        className={`absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-slate-900 text-white transition-[width] duration-150 ${
          peeking ? 'w-60 shadow-2xl z-30' : 'w-16 z-20'
        }`}
      >
        <div className="shrink-0 px-3 py-5 border-b border-slate-700/60">
          <div className={`flex items-center gap-2.5 ${peeking ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              C
            </div>
            {peeking && (
              <div className="min-w-0">
                <h1 className="text-sm font-semibold tracking-tight leading-none truncate">ClinicMS</h1>
                <p className="text-xs text-slate-400 mt-0.5 truncate">Management System</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5">
          <div data-testid="menu-trigger" onMouseEnter={openMenu} onMouseLeave={scheduleMenuClose}>
            <RailButton icon={MenuIcon} label="Menu" showLabel={peeking} />
          </div>
          <div className="pt-2 space-y-0.5">
            {QUICK_ACCESS_ITEMS.map((item) => (
              <RailLink
                key={item.path}
                to={item.path}
                end={item.end}
                icon={item.icon}
                label={item.label}
                showLabel={peeking}
                onClick={closeMenu}
                forceInactive={!activeTabPath}
              />
            ))}
          </div>
        </nav>
      </div>

      {menuHover && (
        <div data-testid="menu-flyout-zone" onMouseEnter={openMenu} onMouseLeave={scheduleMenuClose}>
          <MenuFlyout left={peeking ? PEEK_WIDTH : DOCKED_WIDTH} onNavigate={closeMenu} />
        </div>
      )}
    </aside>
  )
}
