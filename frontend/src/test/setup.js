import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom doesn't implement scrollIntoView (used by TabBar to keep the active tab visible).
Element.prototype.scrollIntoView = vi.fn()

// jsdom doesn't implement ResizeObserver either (used by TabBar to clamp the tab
// strip's width to a whole number of tabs). A no-op stub is enough for unit tests —
// the actual clamped-width behavior is verified live in a real browser.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  cleanup()
})
