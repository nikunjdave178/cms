import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import { LayoutProvider } from '../context/LayoutContext'
import { DASHBOARD_PATH, MAIN_PATH } from '../constants/nav'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { fullName: 'Admin User', role: 'Admin' },
    logout: vi.fn(),
    hasRole: () => true,
  }),
}))

// Rail pulls its links from the real constants/nav.js (e.g. /app/patients), so
// this test's route tree has to match those real paths, not arbitrary ones —
// otherwise clicking a rail link would navigate somewhere this tree can't render.
function renderApp(initialPath = DASHBOARD_PATH) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path={MAIN_PATH} />
            <Route path={DASHBOARD_PATH} element={<div>Dashboard Page Content</div>} />
            <Route path="/app/patients" element={<div>Patients Page Content</div>} />
          </Route>
        </Routes>
      </LayoutProvider>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders the routed page content when a tab is active', () => {
    renderApp(DASHBOARD_PATH)
    expect(screen.getByText('Dashboard Page Content')).toBeInTheDocument()
  })

  it('shows the empty-state placeholder once every tab is closed', () => {
    renderApp(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))
    expect(screen.queryByText('Dashboard Page Content')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing open')).toBeInTheDocument()
  })

  it('goes back to routed content once a new tab is opened from the empty state', () => {
    renderApp(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))
    expect(screen.getByText('Nothing open')).toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByTestId('rail'))
    fireEvent.click(screen.getByText('Patients'))

    expect(screen.queryByText('Nothing open')).not.toBeInTheDocument()
    expect(screen.getByText('Patients Page Content')).toBeInTheDocument()
  })
})
