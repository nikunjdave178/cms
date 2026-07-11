import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'

const LayoutContext = createContext(null)

const TABS_STORAGE_KEY = 'cms:tabs'
const EMPTY_STATE = { tabs: [], activeTabPath: null }

function readTabsState() {
  try {
    const raw = sessionStorage.getItem(TABS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.tabs) && 'activeTabPath' in parsed) return parsed
  } catch {
    // ignore malformed storage
  }
  return null
}

export function LayoutProvider({ children }) {
  const { token } = useAuth()

  const [tabsState, setTabsState] = useState(() => readTabsState() ?? EMPTY_STATE)

  useEffect(() => {
    sessionStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabsState))
  }, [tabsState])

  const prevTokenRef = useRef(token)
  useEffect(() => {
    if (prevTokenRef.current && !token) {
      sessionStorage.removeItem(TABS_STORAGE_KEY)
      setTabsState(EMPTY_STATE)
    }
    prevTokenRef.current = token
  }, [token])

  const openOrActivateTab = (path, fallbackTitle) => {
    setTabsState((prev) => {
      if (prev.tabs.some((t) => t.path === path)) return { ...prev, activeTabPath: path }
      const newTab = { path, title: fallbackTitle ?? path }
      return { tabs: [...prev.tabs, newTab], activeTabPath: path }
    })
  }

  // Returns the path that should become active after the close (or null if no
  // tabs remain) — the caller navigates there if needed.
  const closeTab = (path) => {
    const idx = tabsState.tabs.findIndex((t) => t.path === path)
    if (idx === -1) return tabsState.activeTabPath
    const remaining = tabsState.tabs.filter((t) => t.path !== path)
    const newActive =
      tabsState.activeTabPath === path
        ? (remaining[idx - 1] ?? remaining[0] ?? null)?.path ?? null
        : tabsState.activeTabPath
    setTabsState({ tabs: remaining, activeTabPath: newActive })
    return newActive
  }

  // Bulk-close operations for the tab context menu. Each returns the path that
  // should become active afterward (or null) — same contract as closeTab, so
  // callers navigate there if it differs from where they currently are.
  const closeOtherTabs = (path) => {
    const target = tabsState.tabs.find((t) => t.path === path)
    if (!target) return tabsState.activeTabPath
    setTabsState({ tabs: [target], activeTabPath: path })
    return path
  }

  const closeTabsToTheRight = (path) => {
    const idx = tabsState.tabs.findIndex((t) => t.path === path)
    if (idx === -1) return tabsState.activeTabPath
    const remaining = tabsState.tabs.slice(0, idx + 1)
    const activeSurvives = remaining.some((t) => t.path === tabsState.activeTabPath)
    const newActive = activeSurvives ? tabsState.activeTabPath : path
    setTabsState({ tabs: remaining, activeTabPath: newActive })
    return newActive
  }

  const closeAllTabs = () => {
    setTabsState({ tabs: [], activeTabPath: null })
    return null
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
        tabs: tabsState.tabs,
        activeTabPath: tabsState.activeTabPath,
        openOrActivateTab,
        closeTab,
        closeOtherTabs,
        closeTabsToTheRight,
        closeAllTabs,
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
