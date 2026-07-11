import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UnsavedChangesProvider, useUnsavedChanges } from './UnsavedChangesContext'
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard'

// A minimal stand-in for a guarded page (e.g. PatientDetail's Demographic form):
// tracks its own dirty flag, registers a guard while dirty, and exposes a
// `navigate` button that always goes through runGuarded — exactly how every
// real navigation call site (TabBar, Rail, MenuFlyout) uses it.
function Harness({ onSave, onDiscard }) {
  const [dirty, setDirty] = useState(false)
  const [actionRanCount, setActionRanCount] = useState(0)
  const { runGuarded } = useUnsavedChanges()

  useUnsavedChangesGuard({
    isDirty: dirty,
    onSave: async () => {
      const ok = await onSave()
      if (ok) setDirty(false)
      return ok
    },
    onDiscard: () => {
      onDiscard()
      setDirty(false)
    },
  })

  return (
    <div>
      <div data-testid="dirty">{String(dirty)}</div>
      <div data-testid="action-count">{actionRanCount}</div>
      <button onClick={() => setDirty(true)}>make-dirty</button>
      <button onClick={() => runGuarded(() => setActionRanCount((c) => c + 1))}>navigate</button>
    </div>
  )
}

function renderHarness({ onSave = vi.fn().mockResolvedValue(true), onDiscard = vi.fn() } = {}) {
  render(
    <UnsavedChangesProvider>
      <Harness onSave={onSave} onDiscard={onDiscard} />
    </UnsavedChangesProvider>
  )
  return { onSave, onDiscard }
}

describe('UnsavedChangesContext', () => {
  it('runs the guarded action immediately when nothing is dirty', () => {
    renderHarness()
    fireEvent.click(screen.getByText('navigate'))
    expect(screen.getByTestId('action-count').textContent).toBe('1')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('defers the action and shows the three-option prompt when dirty', () => {
    renderHarness()
    fireEvent.click(screen.getByText('make-dirty'))
    fireEvent.click(screen.getByText('navigate'))

    expect(screen.getByTestId('action-count').textContent).toBe('0')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByText('Save & Continue')).toBeInTheDocument()
    expect(screen.getByText('Continue without saving')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('Save & Continue saves, then runs the deferred action and closes the prompt', async () => {
    const { onSave } = renderHarness()
    fireEvent.click(screen.getByText('make-dirty'))
    fireEvent.click(screen.getByText('navigate'))
    fireEvent.click(screen.getByText('Save & Continue'))

    await waitFor(() => expect(screen.getByTestId('action-count').textContent).toBe('1'))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    expect(screen.getByTestId('dirty').textContent).toBe('false')
  })

  it('keeps the prompt open with an inline error when Save & Continue fails, and never runs the action', async () => {
    const onSave = vi.fn().mockResolvedValue(false)
    renderHarness({ onSave })
    fireEvent.click(screen.getByText('make-dirty'))
    fireEvent.click(screen.getByText('navigate'))
    fireEvent.click(screen.getByText('Save & Continue'))

    await waitFor(() => expect(screen.getByText(/Could not save/)).toBeInTheDocument())
    expect(screen.getByTestId('action-count').textContent).toBe('0')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByTestId('dirty').textContent).toBe('true')
  })

  it('Continue without saving discards the change and runs the deferred action', () => {
    const { onDiscard } = renderHarness()
    fireEvent.click(screen.getByText('make-dirty'))
    fireEvent.click(screen.getByText('navigate'))
    fireEvent.click(screen.getByText('Continue without saving'))

    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('action-count').textContent).toBe('1')
    expect(screen.getByTestId('dirty').textContent).toBe('false')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('Cancel closes the prompt without discarding or running the action', () => {
    const { onDiscard } = renderHarness()
    fireEvent.click(screen.getByText('make-dirty'))
    fireEvent.click(screen.getByText('navigate'))
    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    expect(screen.getByTestId('action-count').textContent).toBe('0')
    expect(onDiscard).not.toHaveBeenCalled()
    expect(screen.getByTestId('dirty').textContent).toBe('true')
  })
})
