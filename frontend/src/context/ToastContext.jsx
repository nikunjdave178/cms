import { createContext, useCallback, useContext, useState } from 'react'
import ToastStack from '../components/ToastStack'

const ToastContext = createContext(null)

let nextId = 1

// Application-wide toast/acknowledgement system. Call showToast(message) after
// any operation whose result the user needs a lightweight, out-of-the-way
// confirmation of (create/update/delete succeeding) — as opposed to errors
// that need to actually stop the user (those stay as inline text or, for
// unmissable ones, a centered ErrorModal).
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, { variant = 'success', duration = 4000 } = {}) => {
    const id = nextId++
    setToasts(ts => [...ts, { id, message, variant }])
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
