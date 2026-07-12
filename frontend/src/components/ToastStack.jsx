import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const VARIANTS = {
  success: { icon: CheckCircle2, classes: 'bg-success-600 text-white' },
  error: { icon: XCircle, classes: 'bg-danger-600 text-white' },
  info: { icon: Info, classes: 'bg-gray-800 text-white' },
}

// Bottom-right stack, portaled to document.body so it sits above everything
// (including open modals) regardless of where the triggering action lives.
export default function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => {
        const { icon: Icon, classes } = VARIANTS[t.variant] ?? VARIANTS.info
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2 rounded-lg shadow-lg px-4 py-3 text-sm font-medium max-w-sm animate-toast-in ${classes}`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 opacity-80 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
