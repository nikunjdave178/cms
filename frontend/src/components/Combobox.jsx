import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Standard free-text field with a styled suggestion dropdown — same popover
 * chrome as Select (rounded-xl, shadow, hover/highlight states) but the
 * value is whatever the user types; picking a suggestion just fills it in.
 * Used for fields that must stay free text (zip, city, state) while still
 * offering fast, keyboard-navigable selection from known values.
 *
 * options: [{ value, label, sublabel? }]
 */
export default function Combobox({
  value, onChange, onSelect, options, placeholder = '', error = false,
  maxLength, inputMode, className = '', id, autoComplete = 'off',
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)

  const filtered = useMemo(() => {
    const q = (value ?? '').trim().toLowerCase()
    if (!q) return options
    return options.filter(o => `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(q))
  }, [options, value])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open || highlight < 0) return
    listRef.current?.querySelector(`[data-idx="${highlight}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  const pick = (opt) => {
    onChange(opt.value)
    onSelect?.(opt)
    setOpen(false)
  }

  const move = (delta) => {
    if (filtered.length === 0) return
    setHighlight(h => (h + delta + filtered.length) % filtered.length)
  }

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setOpen(true); move(1); break
      case 'ArrowUp': e.preventDefault(); setOpen(true); move(-1); break
      case 'Enter':
        if (open && highlight >= 0 && filtered[highlight]) { e.preventDefault(); pick(filtered[highlight]) }
        break
      case 'Escape': if (open) { e.preventDefault(); setOpen(false) } break
      case 'Tab': setOpen(false); break
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        id={id}
        className={`input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlight(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full min-w-[14rem] rounded-xl border border-gray-200 bg-white shadow-lg">
          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.map((opt, idx) => (
              <li key={opt.key ?? `${opt.value}-${idx}`} data-idx={idx}>
                <button
                  type="button"
                  role="option"
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    idx === highlight ? 'bg-blue-50 text-gray-800' : 'text-gray-700'
                  }`}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => pick(opt)}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.sublabel && <span className="text-xs text-gray-400 shrink-0">{opt.sublabel}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
