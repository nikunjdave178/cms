import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLayout } from '../context/LayoutContext'

// Lets a page rename its own tab once it knows a better title (e.g. a loaded record's name).
export function useTabTitle(title) {
  const { pathname } = useLocation()
  const { setTabTitle } = useLayout()

  useEffect(() => {
    if (title) setTabTitle(pathname, title)
  }, [pathname, title])
}
