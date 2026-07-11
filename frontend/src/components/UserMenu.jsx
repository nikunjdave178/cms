import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const initial = user?.fullName?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={user?.fullName}
        className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 hover:bg-primary-700 transition-colors"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-2xl py-2 z-50">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
