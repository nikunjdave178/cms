import { useEffect } from 'react'
import { useUnsavedChanges } from '../context/UnsavedChangesContext'

// The one call a form needs to opt into the app-wide unsaved-changes guard
// (see context/UnsavedChangesContext.jsx): register whenever `isDirty` is true,
// clear on unmount or once clean again. `onSave` should resolve true/false;
// `onDiscard` resets the form back to its last-saved state.
export function useUnsavedChangesGuard({ isDirty, onSave, onDiscard }) {
  const { registerGuard, clearGuard } = useUnsavedChanges()

  useEffect(() => {
    registerGuard({ isDirty, onSave, onDiscard })
    return () => clearGuard()
  }, [isDirty, onSave, onDiscard, registerGuard, clearGuard])
}
