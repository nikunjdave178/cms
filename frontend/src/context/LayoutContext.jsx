import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

const LayoutContext = createContext(null)

const RAIL_STORAGE_KEY = 'cms:railState'
const TABS_STORAGE_KEY = 'cms:tabs'

const DASHBOARD_TAB = { path: '/', title: 'Dashboard', closable: false }

function readRailState() {
  const stored = localStorage.getItem(RAIL_STORAGE_KEY)
  return stored === 'expanded' || stored === 'collapsed' || stored === 'hidden' ? stored : 'expanded'
}

function readTabsState() {
  try {
    const raw = sessionStorage.getItem(TABS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0 && typeof parsed.activeTabPath === 'string') {
      return parsed
    }
  } catch {
    // ignore malformed storage
  }
  return null
}

export function LayoutProvider({ children }) {
  const { token } = useAuth()

  const [railState, setRailStateInternal] = useState(readRailState)
  const [tabsState, setTabsState] = useState(() => readTabsState() ?? { tabs: [DASHBOARD_TAB], activeTabPath: '/' })

  useEffect(() => {
    sessionStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabsState))
  }, [tabsState])

  const prevTokenRef = useRef(token)
  useEffect(() => {
    if (prevTokenRef.current && !token) {
      sessionStorage.removeItem(TABS_STORAGE_KEY)
      setTabsState({ tabs: [DASHBOARD_TAB], activeTabPath: '/' })
    }
    prevTokenRef.current = token
  }, [token])

  const setRailState = (state) => {
    localStorage.setItem(RAIL_STORAGE_KEY, state)
    setRailStateInternal(state)
  }

  const toggleRail = () => setRailState(railState === 'expanded' ? 'collapsed' : 'expanded')
  const hideRail = () => setRailState('hidden')
  const restoreRail = () => setRailState('collapsed')

  const openOrActivateTab = (path, fallbackTitle) => {
    setTabsState((prev) => {
      if (prev.tabs.some((t) => t.path === path)) return { ...prev, activeTabPath: path }
      const newTab = { path, title: fallbackTitle ?? path, closable: true }
      return { tabs: [...prev.tabs, newTab], activeTabPath: path }
    })
  }

  // Returns the path that should become active after the close (caller navigates there if needed).
  const closeTab = (path) => {
    const idx = tabsState.tabs.findIndex((t) => t.path === path)
    if (idx === -1) return tabsState.activeTabPath
    const remaining = tabsState.tabs.filter((t) => t.path !== path)
    const newTabs = remaining.length ? remaining : [DASHBOARD_TAB]
    const newActive =
      tabsState.activeTabPath === path ? (remaining[idx - 1] ?? remaining[0] ?? DASHBOARD_TAB).path : tabsState.activeTabPath
    setTabsState({ tabs: newTabs, activeTabPath: newActive })
    return newActive
  }

  const setActiveTab = (path) => setTabsState((prev) => ({ ...prev, activeTabPath: path }))

  const setTabTitle = (path, title) => {
    setTabsState((prev) => {
      const idx = prev.tabs.findIndex((t) => t.path === path)
      if (idx === -1 || prev.tabs[idx].title === title) return prev
      const newTabs = [...prev.tabs]
      newTabs[idx] = { ...newTabs[idx], title }
      return { ...prev, tabs: newTabs }
    })
  }

  return (
    <LayoutContext.Provider
      value={{
        railState,
        setRailState,
        toggleRail,
        hideRail,
        restoreRail,
        tabs: tabsState.tabs,
        activeTabPath: tabsState.activeTabPath,
        openOrActivateTab,
        closeTab,
        setActiveTab,
        setTabTitle,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
