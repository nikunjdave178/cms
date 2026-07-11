import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UserMenu from './UserMenu'

const mockLogout = vi.fn()
let mockUser = { fullName: 'Admin User', role: 'Admin' }

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}))

describe('UserMenu', () => {
  beforeEach(() => {
    mockLogout.mockClear()
    mockUser = { fullName: 'Admin User', role: 'Admin' }
  })

  it('shows the initial of the user\'s name on the trigger, dropdown closed by default', () => {
    render(<UserMenu />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.queryByText('Log out')).not.toBeInTheDocument()
  })

  it('opens the dropdown on click, showing name, role, and logout', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByTitle('Admin User'))
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Log out')).toBeInTheDocument()
  })

  it('calls logout and closes the menu when Log out is clicked', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByTitle('Admin User'))
    fireEvent.click(screen.getByText('Log out'))
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Log out')).not.toBeInTheDocument()
  })

  it('closes when clicking outside the menu', () => {
    render(
      <div>
        <UserMenu />
        <button>outside</button>
      </div>
    )
    fireEvent.click(screen.getByTitle('Admin User'))
    expect(screen.getByText('Log out')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByText('outside'))
    expect(screen.queryByText('Log out')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(<UserMenu />)
    fireEvent.click(screen.getByTitle('Admin User'))
    expect(screen.getByText('Log out')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Log out')).not.toBeInTheDocument()
  })
})
