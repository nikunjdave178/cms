import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LayoutProvider, useLayout } from './LayoutContext'

let mockToken = 'test-token'

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ token: mockToken }),
}))

function Probe() {
  const { tabs, activeTabPath, openOrActivateTab, closeTab, setActiveTab } = useLayout()
  return (
    <div>
      <div data-testid="tabs">{tabs.map((t) => `${t.path}:${t.title}`).join(',')}</div>
      <div data-testid="active">{activeTabPath ?? '(none)'}</div>
      <button onClick={() => openOrActivateTab('/', 'Dashboard')}>open-dashboard</button>
      <button onClick={() => openOrActivateTab('/patients', 'Patients')}>open-patients</button>
      <button onClick={() => openOrActivateTab('/patients/1', 'John Doe')}>open-john</button>
      <button onClick={() => openOrActivateTab('/patients/2', 'Jane Roe')}>open-jane</button>
      <button onClick={() => closeTab('/')}>close-dashboard</button>
      <button onClick={() => closeTab('/patients')}>close-patients</button>
      <button onClick={() => closeTab('/patients/1')}>close-john</button>
      <button onClick={() => setActiveTab('/patients')}>activate-patients</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <LayoutProvider>
      <Probe />
    </LayoutProvider>
  )
}

beforeEach(() => {
  sessionStorage.clear()
  mockToken = 'test-token'
})

describe('LayoutContext tabs', () => {
  it('starts with no tabs open at all', () => {
    renderProbe()
    expect(screen.getByTestId('tabs').textContent).toBe('')
    expect(screen.getByTestId('active').textContent).toBe('(none)')
  })

  it('opens a new tab and activates it', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    expect(screen.getByTestId('tabs').textContent).toBe('/:Dashboard,/patients:Patients')
    expect(screen.getByTestId('active').textContent).toBe('/patients')
  })

  it('activates an already-open tab instead of duplicating it', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    fireEvent.click(screen.getByText('open-john'))
    fireEvent.click(screen.getByText('open-patients')) // revisit, should not duplicate
    expect(screen.getByTestId('tabs').textContent).toBe('/:Dashboard,/patients:Patients,/patients/1:John Doe')
    expect(screen.getByTestId('active').textContent).toBe('/patients')
  })

  it('opening two different records creates two distinct tabs', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-john'))
    fireEvent.click(screen.getByText('open-jane'))
    expect(screen.getByTestId('tabs').textContent).toBe('/patients/1:John Doe,/patients/2:Jane Roe')
  })

  it('closing the active tab activates its left neighbor', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    fireEvent.click(screen.getByText('open-john')) // active tab is now /patients/1
    fireEvent.click(screen.getByText('close-john'))
    expect(screen.getByTestId('tabs').textContent).toBe('/:Dashboard,/patients:Patients')
    expect(screen.getByTestId('active').textContent).toBe('/patients')
  })

  it('closing a non-active tab leaves the active tab unchanged', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    fireEvent.click(screen.getByText('open-john'))
    fireEvent.click(screen.getByText('activate-patients')) // active is now /patients, John stays open
    fireEvent.click(screen.getByText('close-john'))
    expect(screen.getByTestId('active').textContent).toBe('/patients')
    expect(screen.getByTestId('tabs').textContent).toBe('/:Dashboard,/patients:Patients')
  })

  it('closing a path that was never opened is a no-op', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-patients'))
    fireEvent.click(screen.getByText('close-john')) // '/patients/1' was never opened
    expect(screen.getByTestId('tabs').textContent).toBe('/patients:Patients')
    expect(screen.getByTestId('active').textContent).toBe('/patients')
  })

  it('the Dashboard tab is closable like any other, and closing the last tab leaves nothing active', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    expect(screen.getByTestId('tabs').textContent).toBe('/:Dashboard')
    fireEvent.click(screen.getByText('close-dashboard'))
    expect(screen.getByTestId('tabs').textContent).toBe('')
    expect(screen.getByTestId('active').textContent).toBe('(none)')
  })

  it('closing every open tab one by one ends with activeTabPath null', () => {
    renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    fireEvent.click(screen.getByText('close-patients'))
    fireEvent.click(screen.getByText('close-dashboard'))
    expect(screen.getByTestId('tabs').textContent).toBe('')
    expect(screen.getByTestId('active').textContent).toBe('(none)')
  })

  it('clears tabs to empty when the auth token transitions to logged-out', () => {
    const { rerender } = renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    expect(screen.getByTestId('tabs').textContent).not.toBe('')

    mockToken = null
    rerender(
      <LayoutProvider>
        <Probe />
      </LayoutProvider>
    )
    expect(screen.getByTestId('tabs').textContent).toBe('')
    expect(screen.getByTestId('active').textContent).toBe('(none)')
    expect(JSON.parse(sessionStorage.getItem('cms:tabs')).tabs).toEqual([])
  })

  it('persists tabs to sessionStorage and restores them on the next mount (survives a refresh)', () => {
    const { unmount } = renderProbe()
    fireEvent.click(screen.getByText('open-dashboard'))
    fireEvent.click(screen.getByText('open-patients'))
    unmount()

    renderProbe()
    expect(screen.getByTestId('tabs').textContent).toBe('/:Dashboard,/patients:Patients')
    expect(screen.getByTestId('active').textContent).toBe('/patients')
  })
})
