import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ITEMS = [
  { action: 'reload', label: 'Reload' },
  { action: 'close', label: 'Close', divider: true },
  { action: 'close-others', label: 'Close Others' },
  { action: 'close-right', label: 'Close Tabs to the Right' },
  { action: 'close-all', label: 'Close All Tabs' },
]

// Opened via right-click on a tab (see TabBar.jsx). A portal so it can be
// positioned anywhere on screen without being clipped by the tab strip's own
// overflow-x-auto/rail's peek panel; outside-click and Escape both close it,
// matching UserMenu's dropdown pattern.
export default function TabContextMenu({ x, y, canCloseOthers, canCloseRight, onAction, onClose }) {
  const ref = useRef(null)
  const [style, setStyle] = useState({ top: y, left: x, visibility: 'hidden' })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))
    setStyle({ top, left, visibility: 'visible' })
  }, [x, y])

  useLayoutEffect(() => {
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) onClose()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const disabledFor = (action) =>
    (action === 'close-others' && !canCloseOthers) || (action === 'close-right' && !canCloseRight)

  return createPortal(
    <div
      ref={ref}
      data-testid="tab-context-menu"
      style={{ position: 'fixed', ...style }}
      className="z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-2xl py-1"
    >
      {ITEMS.map(({ action, label, divider }) => {
        const disabled = disabledFor(action)
        return (
          <button
            key={action}
            data-testid={`tab-context-menu-${action}`}
            disabled={disabled}
            onClick={() => onAction(action)}
            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
              divider ? 'border-t border-gray-100' : ''
            } ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        )
      })}
    </div>,
    document.body
  )
}
