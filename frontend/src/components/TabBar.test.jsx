import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import TabBar from './TabBar'
import { LayoutProvider } from '../context/LayoutContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

function renderTabBar(initialPath = '/') {
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

function renderTabBarWithRenavigate(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LayoutProvider>
        <TabBar />
        <RenavigateToSamePath />
      </LayoutProvider>
    </MemoryRouter>
  )
}

describe('TabBar', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('opens a tab automatically for the initial route', () => {
    renderTabBar('/')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('gives every tab the same fixed width regardless of title length', () => {
    renderTabBar('/patients')
    const tab = screen.getByText('Patients').closest('button')
    expect(tab.className).toMatch(/\bw-40\b/)
  })

  it('shows the close button without requiring hover', () => {
    renderTabBar('/')
    const tab = screen.getByText('Dashboard').closest('button')
    const closeBtn = within(tab).getByTestId('tab-close')
    expect(closeBtn.className).not.toMatch(/opacity-0/)
  })

  it('the Dashboard tab can be closed like any other tab', () => {
    renderTabBar('/')
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('closing the only open tab leaves the tab strip empty', () => {
    renderTabBar('/')
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))
    expect(screen.queryAllByRole('button', { name: /dashboard/i })).toHaveLength(0)
    expect(document.querySelectorAll('button.w-40')).toHaveLength(0)
  })

  it('keeps the bar present with its user-menu button even with zero tabs', () => {
    renderTabBar('/')
    const tab = screen.getByText('Dashboard').closest('button')
    fireEvent.click(within(tab).getByTestId('tab-close'))

    expect(screen.getByTestId('tab-bar')).toBeInTheDocument()
    // the user-menu avatar trigger is the one button that must survive
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it(
    'reopens a tab when re-navigating to the path whose tab was just closed ' +
      '(regression: clicking Dashboard did nothing if the URL never changed)',
    () => {
      renderTabBarWithRenavigate('/')
      const tab = screen.getByText('Dashboard').closest('button')
      fireEvent.click(within(tab).getByTestId('tab-close'))
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()

      // pathname stays "/" — this is exactly what a rail/menu click to the
      // already-current route does
      fireEvent.click(screen.getByText('renavigate'))

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    }
  )
})
