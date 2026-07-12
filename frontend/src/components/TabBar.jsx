import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLayout } from '../context/LayoutContext'
import { useUnsavedChanges } from '../context/UnsavedChangesContext'
import { matchNavItem, MAIN_PATH } from '../constants/nav'
import UserMenu from './UserMenu'
import TabContextMenu from './TabContextMenu'

// Must match the tab button's width class (w-40 = 10rem) below — kept as a
// constant so chevron clicks can step by whole tabs, never a partial one.
const TAB_WIDTH_PX = 160

export default function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    tabs,
    activeTabPath,
    openOrActivateTab,
    closeTab,
    closeOtherTabs,
    closeTabsToTheRight,
    closeAllTabs,
    setActiveTab,
  } = useLayout()
  const { runGuarded } = useUnsavedChanges()

  const measureRef = useRef(null)
  const scrollRef = useRef(null)
  const tabRefs = useRef({})
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [stripWidth, setStripWidth] = useState(0)
  const [contextMenu, setContextMenu] = useState(null) // { path, x, y }

  // The visible tab strip's width must itself be an exact multiple of
  // TAB_WIDTH_PX — otherwise, whatever's left over after fitting N whole tabs
  // shows as a sliver of the next one. Measuring the naturally-flexed wrapper
  // (rather than the scroll strip itself) avoids a feedback loop: the strip's
  // own width is what we're setting, so it can't also be what we measure.
  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width
      setStripWidth(Math.floor(available / TAB_WIDTH_PX) * TAB_WIDTH_PX)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Opens/activates a tab for every navigation, regardless of source (rail, menu modal,
  // in-page links, redirects, back/forward, direct URL) — the router already produces
  // one canonical location for all of them, so hooking it here is exhaustive.
  //
  // location.key (not just pathname) is in the deps: react-router assigns a fresh key
  // to every navigation entry, including a repeat navigation to the path you're
  // already on. Keying on pathname alone misses that case — e.g. close the only open
  // tab while on a route, click that same nav item again, pathname is unchanged so
  // the effect wouldn't re-fire and the tab would never reopen.
  //
  // MAIN_PATH is the deliberately blank landing route — it never opens a tab, and
  // landing on it (directly, or because the last tab just closed) clears whatever
  // tab was active so Layout shows the empty state instead of stale page content.
  useEffect(() => {
    if (location.pathname === MAIN_PATH) {
      setActiveTab(null)
      return
    }
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

  // Steps by however many whole tabs fit in the visible strip (at least one),
  // so a chevron click always lands on a tab boundary — never a partial tab.
  // Combined with scroll-snap on the strip/tabs below, this also keeps trackpad
  // and shift+wheel scrolling snapped to whole tabs, not just chevron clicks.
  //
  // The target is clamped to the *last tab-aligned* position, not the raw
  // scrollWidth - clientWidth max: when the total tab width isn't an exact
  // multiple of the visible width (the common case), that raw max falls
  // mid-tab, and the browser scroll-clamps there regardless of scroll-snap —
  // which would cut the leftmost visible tab off at the far-right end. Landing
  // one boundary short and leaving a little empty space instead is preferable
  // to ever slicing a tab.
  const scrollByTabs = (direction) => {
    const el = scrollRef.current
    if (!el) return
    const tabsPerPage = Math.max(1, Math.floor(el.clientWidth / TAB_WIDTH_PX))
    const maxAligned = Math.max(0, Math.floor((el.scrollWidth - el.clientWidth) / TAB_WIDTH_PX) * TAB_WIDTH_PX)
    const target = el.scrollLeft + direction * tabsPerPage * TAB_WIDTH_PX
    el.scrollTo({ left: Math.min(Math.max(target, 0), maxAligned), behavior: 'smooth' })
  }

  // newActive is null once no tabs remain — route to the blank landing page
  // instead of leaving the URL stuck on a just-closed tab's route (which would
  // silently reopen it on a refresh).
  //
  // Only the active tab can be carrying unsaved changes, so closing a
  // background tab never needs guarding — closing the active one does, since
  // it both removes the tab AND navigates away from whatever was showing.
  const closeTabAndNavigate = (path) => {
    const wasActive = path === activeTabPath
    if (!wasActive) {
      closeTab(path)
      return
    }
    runGuarded(() => {
      const newActive = closeTab(path)
      navigate(newActive ?? MAIN_PATH)
    })
  }

  const handleClose = (e, path) => {
    e.stopPropagation()
    closeTabAndNavigate(path)
  }

  const openContextMenu = (e, path) => {
    e.preventDefault()
    setContextMenu({ path, x: e.clientX, y: e.clientY })
  }

  const closeContextMenu = () => setContextMenu(null)

  // Whether the currently active tab survives a given bulk-close action,
  // computed from the current tab list *before* performing it — only guard
  // when the active (possibly dirty) tab would actually be removed. Without
  // this, e.g. right-clicking the active dirty tab and choosing "Close Others"
  // (which keeps it open) would prompt for nothing lost.
  const activeTabSurvives = (action, clickedPath) => {
    if (action === 'close-all') return false
    if (action === 'close-others') return clickedPath === activeTabPath
    if (action === 'close-right') {
      const clickedIdx = tabs.findIndex((t) => t.path === clickedPath)
      const activeIdx = tabs.findIndex((t) => t.path === activeTabPath)
      return activeIdx !== -1 && activeIdx <= clickedIdx
    }
    return true
  }

  // A full browser reload, not a client-side re-render — the simplest way to
  // guarantee every hook/effect on that tab's page genuinely starts fresh.
  // Only the active tab can be dirty, so only it needs to go through the
  // unsaved-changes guard; reloading a background tab is just a plain
  // navigation (it isn't mounted, so there's nothing live to lose).
  const reloadTab = (path) => {
    const isActive = path === activeTabPath
    const doReload = () => {
      if (path === location.pathname) window.location.reload()
      else window.location.href = path
    }
    if (isActive) runGuarded(doReload)
    else doReload()
  }

  const runContextMenuAction = (action) => {
    if (!contextMenu) return
    const { path } = contextMenu
    closeContextMenu()

    if (action === 'reload') {
      reloadTab(path)
      return
    }

    if (action === 'close') {
      closeTabAndNavigate(path)
      return
    }

    const performAction = () => {
      const newActive =
        action === 'close-others' ? closeOtherTabs(path) : action === 'close-right' ? closeTabsToTheRight(path) : closeAllTabs()
      navigate(newActive ?? MAIN_PATH)
    }

    if (activeTabSurvives(action, path)) performAction()
    else runGuarded(performAction)
  }

  return (
    <div data-testid="tab-bar" className="shrink-0 min-h-[3.25rem] bg-white border-b border-gray-200 flex items-stretch">
      {canScrollLeft && (
        <button
          onClick={() => scrollByTabs(-1)}
          className="shrink-0 flex items-center px-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
      )}

      <div ref={measureRef} className="flex-1 min-w-0 overflow-hidden flex items-stretch">
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          style={{ width: stripWidth ? `${stripWidth}px` : '100%' }}
          className="flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory"
        >
          {tabs.map((tab) => {
            const isActive = tab.path === activeTabPath
            return (
              <button
                key={tab.path}
                ref={(el) => (tabRefs.current[tab.path] = el)}
                onClick={() => {
                  if (tab.path === activeTabPath) {
                    navigate(tab.path)
                    return
                  }
                  runGuarded(() => navigate(tab.path))
                }}
                onContextMenu={(e) => openContextMenu(e, tab.path)}
                className={`shrink-0 snap-start w-40 flex items-center justify-between gap-2 pl-4 pr-2 py-2.5 text-sm font-medium border-r border-gray-200 transition-colors ${
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
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollByTabs(1)}
          className="shrink-0 flex items-center px-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      )}

      <div className="shrink-0 flex items-center border-l border-gray-200 px-3">
        <UserMenu />
      </div>

      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          canCloseOthers={tabs.length > 1}
          canCloseRight={tabs.findIndex((t) => t.path === contextMenu.path) < tabs.length - 1}
          onAction={runContextMenuAction}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
