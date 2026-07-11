import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom doesn't implement scrollIntoView (used by TabBar to keep the active tab visible).
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
})
