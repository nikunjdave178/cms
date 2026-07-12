import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/**
 * Checkbox-list multi-value dropdown, for filters where more than one value
 * can apply at once (e.g. Gender, Blood Group) — sibling to the single-value
 * `Select`, not a replacement for it.
 *
 * value: array of selected values (compared as strings).
 * onChange: (newArray) => void.
 * options: [{ value, label }].
 * A clear (x) sits inline in the trigger once anything is selected, so a
 * filter can be reset without opening the dropdown or hitting the page's
 * global "Clear" button.
 */
export default function MultiSelect({ value = [], onChange, options, placeholder = 'All', className = '', id }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)

  const selected = options.filter(o => value.some(v => String(v) === String(o.value)))

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (opt) => {
    const has = value.some(v => String(v) === String(opt.value))
    onChange(has ? value.filter(v => String(v) !== String(opt.value)) : [...value, opt.value])
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange([])
  }

  const label = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? selected.map(o => o.label).join(', ')
      : `${selected.length} selected`

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className="input flex items-center gap-2 text-left"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`flex-1 truncate ${selected.length ? '' : 'text-gray-400'}`}>{label}</span>
        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onClick={clear}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
        <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 min-w-full w-max max-w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          <ul role="listbox" aria-multiselectable="true" className="max-h-64 overflow-y-auto py-1">
            {options.map((opt, idx) => {
              const isSelected = value.some(v => String(v) === String(opt.value))
              return (
                <li key={opt.value ?? idx}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => toggle(opt)}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd"
                            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.79 6.8-6.8a1 1 0 011.4 0z" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate">{opt.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {selected.length > 0 && (
            <div className="border-t border-gray-100 p-1.5">
              <button type="button" className="w-full rounded-md px-2 py-1 text-left text-xs text-gray-500 hover:bg-gray-50" onClick={clear}>
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
