import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLayout } from '../context/LayoutContext'
import { matchNavItem } from '../constants/nav'
import UserMenu from './UserMenu'

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tabs, activeTabPath, openOrActivateTab, closeTab } = useLayout()

  const scrollRef = useRef(null)
  const tabRefs = useRef({})
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Opens/activates a tab for every navigation, regardless of source (rail, menu modal,
  // in-page links, redirects, back/forward, direct URL) — the router already produces
  // one canonical location for all of them, so hooking it here is exhaustive.
  //
  // location.key (not just pathname) is in the deps: react-router assigns a fresh key
  // to every navigation entry, including a repeat navigation to the path you're
  // already on. Keying on pathname alone misses that case — e.g. close the only open
  // tab while on "/", click "Dashboard" again, pathname stays "/" so the effect
  // wouldn't re-fire and the tab would never reopen.
  useEffect(() => {
    const navItem = matchNavItem(location.pathname)
    openOrActivateTab(location.pathname, navItem?.label ?? location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.key])

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollState()
  }, [tabs])

  useEffect(() => {
    tabRefs.current[activeTabPath]?.scrollIntoView({ inline: 'nearest', behavior: 'smooth' })
  }, [activeTabPath])

  const scrollBy = (delta) => scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })

  const handleClose = (e, path) => {
    e.stopPropagation()
    const wasActive = path === activeTabPath
    const newActive = closeTab(path)
    // newActive is null once the last tab closes — nothing to route to; Layout
    // swaps to the empty-state placeholder instead based on activeTabPath.
    if (wasActive && newActive) navigate(newActive)
  }

  return (
    <div data-testid="tab-bar" className="shrink-0 min-h-[3.25rem] bg-white border-b border-gray-200 flex items-stretch">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-200)}
          className="shrink-0 flex items-center px-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex-1 min-w-0 flex items-stretch overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.path === activeTabPath
          return (
            <button
              key={tab.path}
              ref={(el) => (tabRefs.current[tab.path] = el)}
              onClick={() => navigate(tab.path)}
              className={`shrink-0 w-40 flex items-center justify-between gap-2 pl-4 pr-2 py-2.5 text-sm font-medium border-r border-gray-200 transition-colors ${
                isActive ? 'bg-gray-50 text-primary-700 border-b-2 border-b-primary-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-left">{tab.title}</span>
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Close ${tab.title} tab`}
                data-testid="tab-close"
                onClick={(e) => handleClose(e, tab.path)}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </button>
          )
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollBy(200)}
          className="shrink-0 flex items-center px-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      )}

      <div className="shrink-0 flex items-center border-l border-gray-200 px-3">
        <UserMenu />
      </div>
    </div>
  )
}
