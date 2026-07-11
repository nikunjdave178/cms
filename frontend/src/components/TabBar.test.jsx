import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
