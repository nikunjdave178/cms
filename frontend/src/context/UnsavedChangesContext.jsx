import { createContext, useCallback, useContext, useRef, useState } from 'react'
import UnsavedChangesModal from '../components/UnsavedChangesModal'

const UnsavedChangesContext = createContext(null)

// Application-wide unsaved-changes guard. A page registers a guard describing
// its current dirty state + how to save/discard; every navigation call site in
// the app shell (TabBar, Rail, MenuFlyout — see those files) routes its action
// through runGuarded() instead of acting directly, so any guarded page's edits
// can't be silently lost by switching tabs, closing the tab, or navigating away.
//
// The guard itself is a ref, not state — it's only ever read at the moment a
// guarded action is attempted, never rendered, so registering/clearing it
// doesn't need to trigger a re-render of anything.
export function UnsavedChangesProvider({ children }) {
  const guardRef = useRef(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const registerGuard = useCallback((guard) => {
    guardRef.current = guard
  }, [])

  const clearGuard = useCallback(() => {
    guardRef.current = null
  }, [])

  const runGuarded = useCallback((action) => {
    const guard = guardRef.current
    if (!guard || !guard.isDirty) {
      action()
      return
    }
    setError(null)
    setPendingAction(() => action)
  }, [])

  const closePrompt = () => {
    setPendingAction(null)
    setError(null)
  }

  const handleSaveAndContinue = async () => {
    const guard = guardRef.current
    if (!guard) {
      closePrompt()
      return
    }
    setSaving(true)
    setError(null)
    try {
      const ok = await guard.onSave()
      if (ok) {
        const action = pendingAction
        setPendingAction(null)
        action?.()
      } else {
        setError('Could not save. Fix the highlighted fields and try again, or continue without saving.')
      }
    } catch (e) {
      setError(e.message ?? 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscardAndContinue = () => {
    guardRef.current?.onDiscard?.()
    const action = pendingAction
    setPendingAction(null)
    setError(null)
    action?.()
  }

  return (
    <UnsavedChangesContext.Provider value={{ registerGuard, clearGuard, runGuarded }}>
      {children}
      {pendingAction && (
        <UnsavedChangesModal
          saving={saving}
          error={error}
          onSaveAndContinue={handleSaveAndContinue}
          onDiscardAndContinue={handleDiscardAndContinue}
          onCancel={closePrompt}
        />
      )}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
}
