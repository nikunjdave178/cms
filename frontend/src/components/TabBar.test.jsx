import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import TabBar from './TabBar'
import { LayoutProvider, useLayout } from '../context/LayoutContext'
import { MAIN_PATH, DASHBOARD_PATH } from '../constants/nav'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

function renderTabBar(initialPath = DASHBOARD_PATH) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <TabBar />
      </LayoutProvider>
    </MemoryRouter>
  )
}

// Re-navigates to whatever the current pathname already is — exactly what
// clicking a rail/menu NavLink does when you're already on that route.
function RenavigateToSamePath() {
  const navigate = useNavigate()
  const location = useLocation()
  return <button onClick={() => navigate(location.pathname)}>renavigate</button>
}

function renderTabBarWithRenavigate(initialPath = DASHBOARD_PATH) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <TabBar />
        <RenavigateToSamePath />
      </LayoutProvider>
    </MemoryRouter>
  )
}

// Removes a tab from context without going through TabBar's own close-and-navigate
// handler — simulating the tab/URL falling out of sync some other way, to test the
// location.key resync in isolation from the MAIN_PATH-redirect-on-close behavior.
function CloseTabWithoutNavigating({ path }) {
  const { closeTab } = useLayout()
  return <button onClick={() => closeTab(path)}>close-without-navigating</button>
}

describe('TabBar', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('opens a tab automatically for the initial route', () => {
    renderTabBar(DASHBOARD_PATH)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('gives every tab the same fixed width regardless of title length', () => {
    renderTabBar('/app/patients')
    const tab = screen.getByText('Patients').closest('button')
    expect(tab.className).toMatch(/\bw-40\b/)
  })

  it('shows the close button without requiring hover', () => {
    renderTabBar(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    const closeBtn = within(tab).getByTestId('tab-close')
    expect(closeBtn.className).not.toMatch(/opacity-0/)
  })

  it('the Dashboard tab can be closed like any other tab', () => {
    renderTabBar(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('closing the only open tab leaves the tab strip empty', () => {
    renderTabBar(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))
    expect(screen.queryAllByRole('button', { name: /dashboard/i })).toHaveLength(0)
    expect(document.querySelectorAll('button.w-40')).toHaveLength(0)
  })

  it('keeps the bar present with its user-menu button even with zero tabs', () => {
    renderTabBar(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))

    expect(screen.getByTestId('tab-bar')).toBeInTheDocument()
    // the user-menu avatar trigger is the one button that must survive
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it(
    'resyncs the tab for the current pathname on any re-navigation to it, even if the ' +
      'pathname itself is unchanged (regression: originally, closing a tab without the URL ' +
      'moving meant clicking that nav item again did nothing, since pathname alone never changed)',
    () => {
      render(
        <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
          <LayoutProvider>
            <TabBar />
            <CloseTabWithoutNavigating path={DASHBOARD_PATH} />
            <RenavigateToSamePath />
          </LayoutProvider>
        </MemoryRouter>
      )
      expect(screen.getByText('Dashboard')).toBeInTheDocument()

      fireEvent.click(screen.getByText('close-without-navigating'))
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()

      // URL never changed (still DASHBOARD_PATH) — only location.key does on this
      // re-navigation, which is what lets the effect notice and reopen the tab
      fireEvent.click(screen.getByText('renavigate'))
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    }
  )

  it('never opens a tab for MAIN_PATH, and clears the active tab when landing on it', () => {
    renderTabBar(MAIN_PATH)
    expect(document.querySelectorAll('button.w-40')).toHaveLength(0)
  })

  it('closing the last tab navigates to MAIN_PATH instead of leaving the URL stale', () => {
    renderTabBarWithRenavigate(DASHBOARD_PATH)
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))

    // re-navigating to the same (now-blank) path must NOT reopen a Dashboard tab,
    // proving the URL actually moved to MAIN_PATH rather than staying on
    // DASHBOARD_PATH with the tab merely hidden
    fireEvent.click(screen.getByText('renavigate'))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})
