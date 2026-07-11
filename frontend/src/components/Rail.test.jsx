import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Rail from './Rail'
import { LayoutProvider } from '../context/LayoutContext'
import { UnsavedChangesProvider } from '../context/UnsavedChangesContext'

let mockHasRole = () => true

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Admin User', role: 'Admin' },
    logout: vi.fn(),
    hasRole: (...roles) => mockHasRole(...roles),
  }),
}))

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function renderRail() {
  return render(
    <MemoryRouter>
      <LayoutProvider>
        <UnsavedChangesProvider>
          <Rail />
        </UnsavedChangesProvider>
      </LayoutProvider>
    </MemoryRouter>
  )
}

function hoverRail() {
  fireEvent.mouseEnter(screen.getByTestId('rail'))
}

function hoverMenuTrigger() {
  fireEvent.mouseEnter(screen.getByTestId('menu-trigger'))
}

describe('Rail', () => {
  beforeEach(() => {
    mockHasRole = () => true
    sessionStorage.clear()
  })

  it('docks icon-only, with no labels, until hovered', () => {
    renderRail()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.getByTestId('rail')).toBeInTheDocument()
  })

  it('peeks open with labels on hover', () => {
    renderRail()
    hoverRail()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Patients')).toBeInTheDocument()
  })

  it('opens the menu flyout on hovering the Menu row — no click required', () => {
    renderRail()
    hoverRail()
    hoverMenuTrigger()
    expect(screen.getByTestId('menu-flyout')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it(
    'keeps the flyout open when the mouse moves from the Menu row into the flyout ' +
      '(regression: it used to close before the mouse arrived)',
    async () => {
      renderRail()
      hoverRail()
      hoverMenuTrigger()
      expect(screen.getByTestId('menu-flyout')).toBeInTheDocument()

      // Mouse leaves the trigger row, heading toward the flyout — this schedules
      // a close after MENU_CLOSE_DELAY_MS (200ms). relatedTarget is set to the
      // flyout so React's synthetic mouseenter/mouseleave delegation knows the
      // pointer is still within the <aside> subtree (a bare fireEvent with no
      // relatedTarget reads as "left to nowhere," which spuriously also fires
      // the aside's own onMouseLeave and closes it immediately — not realistic
      // for an actual mouse move between two elements in the same rail).
      const flyoutZone = screen.getByTestId('menu-flyout-zone')
      fireEvent.mouseLeave(screen.getByTestId('menu-trigger'), { relatedTarget: flyoutZone })
      // ... and lands on the flyout well before that grace period elapses
      await wait(50)
      fireEvent.mouseEnter(flyoutZone)

      // even well past the original close delay, it must still be open —
      // entering the flyout should have cancelled the pending close
      await wait(300)
      expect(screen.getByTestId('menu-flyout')).toBeInTheDocument()
    }
  )

  it('closes the flyout if the mouse leaves the row and never reaches the flyout', async () => {
    renderRail()
    hoverRail()
    hoverMenuTrigger()
    fireEvent.mouseLeave(screen.getByTestId('menu-trigger'))

    await wait(300)
    expect(screen.queryByTestId('menu-flyout')).not.toBeInTheDocument()
  })

  it('closes immediately when the mouse leaves the whole rail', () => {
    renderRail()
    hoverRail()
    hoverMenuTrigger()
    expect(screen.getByTestId('menu-flyout')).toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByTestId('rail'))
    expect(screen.queryByTestId('menu-flyout')).not.toBeInTheDocument()
  })

  it('hides the Administration category for non-Admin roles', () => {
    mockHasRole = (...roles) => !roles.includes('Admin')
    renderRail()
    hoverRail()
    hoverMenuTrigger()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
    // "Patients" also appears as a quick-access rail link while peeking, so scope
    // this assertion to the flyout itself.
    expect(within(screen.getByTestId('menu-flyout')).getByText('Patients')).toBeInTheDocument()
  })

  it('collapses the peeked rail as soon as a quick-access link is clicked', () => {
    renderRail()
    hoverRail()
    expect(screen.getByText('Patients')).toBeInTheDocument() // peeked, labels visible
    fireEvent.click(screen.getByText('Patients'))
    // peeking is now false, so labels (which only render while peeking) are gone
    expect(screen.queryByText('Patients')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('closes the flyout and collapses the rail as soon as a menu item is clicked', () => {
    renderRail()
    hoverRail()
    hoverMenuTrigger()
    expect(screen.getByTestId('menu-flyout')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Doctors'))
    expect(screen.queryByTestId('menu-flyout')).not.toBeInTheDocument()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
  })
})
