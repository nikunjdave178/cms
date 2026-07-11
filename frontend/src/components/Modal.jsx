import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ onClose, title, size = 'md', children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    panelRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[85vh] flex flex-col outline-none`}
      >
        {title && (
          <div className="shrink-0 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
        )}
        <div className="min-h-0 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
