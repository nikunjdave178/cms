import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import TabBar from './TabBar'
import { LayoutProvider, useLayout } from '../context/LayoutContext'
import { UnsavedChangesProvider } from '../context/UnsavedChangesContext'
import { MAIN_PATH, DASHBOARD_PATH } from '../constants/nav'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

function renderTabBar(initialPath = DASHBOARD_PATH) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <UnsavedChangesProvider>
          <TabBar />
        </UnsavedChangesProvider>
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
        <UnsavedChangesProvider>
          <TabBar />
          <RenavigateToSamePath />
        </UnsavedChangesProvider>
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

// Lets a test accumulate several open tabs by navigating around, the same way
// clicking rail/menu links would in the real app.
function NavigateButtons() {
  const navigate = useNavigate()
  return (
    <div>
      <button onClick={() => navigate('/app/patients')}>go-patients</button>
      <button onClick={() => navigate('/app/appointments')}>go-appointments</button>
      <button onClick={() => navigate('/app/billing')}>go-billing</button>
    </div>
  )
}

function renderTabBarWithNavigation(initialPath = DASHBOARD_PATH) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <UnsavedChangesProvider>
          <TabBar />
          <NavigateButtons />
        </UnsavedChangesProvider>
      </LayoutProvider>
    </MemoryRouter>
  )
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
            <UnsavedChangesProvider>
              <TabBar />
              <CloseTabWithoutNavigating path={DASHBOARD_PATH} />
              <RenavigateToSamePath />
            </UnsavedChangesProvider>
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

  describe('tab context menu', () => {
    it('opens on right-click with all five actions, and closes on Escape without acting', () => {
      renderTabBar(DASHBOARD_PATH)
      const tab = screen.getByText('Dashboard').closest('button')
      fireEvent.contextMenu(tab)

      expect(screen.getByTestId('tab-context-menu')).toBeInTheDocument()
      expect(screen.getByTestId('tab-context-menu-reload')).toBeInTheDocument()
      expect(screen.getByTestId('tab-context-menu-close')).toBeInTheDocument()
      expect(screen.getByTestId('tab-context-menu-close-others')).toBeInTheDocument()
      expect(screen.getByTestId('tab-context-menu-close-right')).toBeInTheDocument()
      expect(screen.getByTestId('tab-context-menu-close-all')).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(screen.queryByTestId('tab-context-menu')).not.toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument() // untouched
    })

    it('closes on an outside click without performing any action', () => {
      renderTabBar(DASHBOARD_PATH)
      const tab = screen.getByText('Dashboard').closest('button')
      fireEvent.contextMenu(tab)
      expect(screen.getByTestId('tab-context-menu')).toBeInTheDocument()

      fireEvent.mouseDown(document.body)
      expect(screen.queryByTestId('tab-context-menu')).not.toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('disables "Close Others" when it is the only open tab, and "Close Tabs to the Right" on the last tab', () => {
      renderTabBar(DASHBOARD_PATH)
      const tab = screen.getByText('Dashboard').closest('button')
      fireEvent.contextMenu(tab)
      expect(screen.getByTestId('tab-context-menu-close-others')).toBeDisabled()
      expect(screen.getByTestId('tab-context-menu-close-right')).toBeDisabled()
    })

    it('"Close" removes exactly the right-clicked tab, even if it is not the active one', () => {
      renderTabBarWithNavigation(DASHBOARD_PATH)
      fireEvent.click(screen.getByText('go-patients')) // active is now Patients; Dashboard stays open in back

      const dashboardTab = screen.getByText('Dashboard').closest('button')
      fireEvent.contextMenu(dashboardTab)
      fireEvent.click(screen.getByTestId('tab-context-menu-close'))

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.getByText('Patients')).toBeInTheDocument() // untouched, still active
    })

    it('"Close Others" keeps only the right-clicked tab and switches to it', () => {
      renderTabBarWithNavigation(DASHBOARD_PATH)
      fireEvent.click(screen.getByText('go-patients'))
      fireEvent.click(screen.getByText('go-appointments')) // active is now Appointments

      const patientsTab = screen.getByText('Patients').closest('button')
      fireEvent.contextMenu(patientsTab)
      fireEvent.click(screen.getByTestId('tab-context-menu-close-others'))

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByText('Appointments')).not.toBeInTheDocument()
      const remaining = screen.getByText('Patients').closest('button')
      expect(remaining.className).toMatch(/text-primary-700/) // now active
    })

    it('"Close Tabs to the Right" removes only later tabs and keeps a still-open active tab active', () => {
      renderTabBarWithNavigation(DASHBOARD_PATH)
      fireEvent.click(screen.getByText('go-patients'))
      fireEvent.click(screen.getByText('go-appointments'))
      fireEvent.click(screen.getByText('go-billing')) // active is now Billing, rightmost

      const patientsTab = screen.getByText('Patients').closest('button')
      fireEvent.contextMenu(patientsTab)
      fireEvent.click(screen.getByTestId('tab-context-menu-close-right'))

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Patients')).toBeInTheDocument()
      expect(screen.queryByText('Appointments')).not.toBeInTheDocument()
      expect(screen.queryByText('Billing')).not.toBeInTheDocument()
      // Billing was active and got removed, so the right-clicked tab (Patients) takes over
      const patientsAfter = screen.getByText('Patients').closest('button')
      expect(patientsAfter.className).toMatch(/text-primary-700/)
    })

    it('"Close All Tabs" empties the strip and shows the empty state', () => {
      renderTabBarWithNavigation(DASHBOARD_PATH)
      fireEvent.click(screen.getByText('go-patients'))

      const tab = screen.getByText('Patients').closest('button')
      fireEvent.contextMenu(tab)
      fireEvent.click(screen.getByTestId('tab-context-menu-close-all'))

      expect(document.querySelectorAll('button.w-40')).toHaveLength(0)
    })

    describe('reload', () => {
      let originalLocation

      beforeEach(() => {
        originalLocation = window.location
        delete window.location
        window.location = { ...originalLocation, reload: vi.fn() }
      })

      afterEach(() => {
        window.location = originalLocation
      })

      it('reloads the page in place when reloading the active tab', () => {
        renderTabBar(DASHBOARD_PATH)
        const tab = screen.getByText('Dashboard').closest('button')
        fireEvent.contextMenu(tab)
        fireEvent.click(screen.getByTestId('tab-context-menu-reload'))

        expect(window.location.reload).toHaveBeenCalledTimes(1)
      })

      it('navigates to the tab\'s route instead of reloading in place for a background tab', () => {
        renderTabBarWithNavigation(DASHBOARD_PATH)
        fireEvent.click(screen.getByText('go-patients')) // active is now Patients; Dashboard is in the background

        const dashboardTab = screen.getByText('Dashboard').closest('button')
        fireEvent.contextMenu(dashboardTab)
        fireEvent.click(screen.getByTestId('tab-context-menu-reload'))

        expect(window.location.href).toBe(DASHBOARD_PATH)
        expect(window.location.reload).not.toHaveBeenCalled()
      })
    })
  })
})
