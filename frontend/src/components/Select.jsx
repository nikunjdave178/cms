import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Standard dropdown used across the app in place of native <select>.
 *
 * options: [{ value, label, sublabel?, disabled?, searchText?, render? }]
 * - value/onChange keep the caller's value type (compared as strings).
 * - searchable: shows a filter box (use for long lists).
 * - size: 'md' (form fields) | 'sm' (table cells, compact toolbars).
 * - error: renders the red invalid-field border.
 * - renderTrigger(option): custom content for the closed state.
 *
 * Keyboard: ArrowUp/Down, Home/End, Enter/Space, Esc, plus type-ahead.
 */
export default function Select({
  value, onChange, options, placeholder = 'Select…',
  searchable = false, disabled = false, error = false,
  size = 'md', className = '', renderTrigger, id,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const searchRef = useRef(null)
  const buttonRef = useRef(null)
  const typeahead = useRef({ buffer: '', at: 0 })

  const selectedIndex = options.findIndex(o => String(o.value) === String(value))
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o =>
      `${o.label} ${o.sublabel ?? ''} ${o.searchText ?? ''}`.toLowerCase().includes(q))
  }, [options, query])

  const openList = () => {
    if (disabled) return
    setQuery('')
    const idx = options.findIndex(o => String(o.value) === String(value))
    setHighlight(idx)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Keep the highlighted option visible while navigating / after opening.
  useEffect(() => {
    if (!open || highlight < 0) return
    listRef.current?.querySelector(`[data-idx="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, highlight])

  const pick = (opt) => {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const move = (delta) => {
    if (filtered.length === 0) return
    setHighlight(h => {
      let next = h
      for (let i = 0; i < filtered.length; i++) {
        next = (next + delta + filtered.length) % filtered.length
        if (!filtered[next]?.disabled) break
      }
      return next
    })
  }

  const handleTypeahead = (key) => {
    const now = Date.now()
    const t = typeahead.current
    t.buffer = (now - t.at < 700 ? t.buffer : '') + key.toLowerCase()
    t.at = now
    const idx = filtered.findIndex(o => String(o.label).toLowerCase().startsWith(t.buffer))
    if (idx >= 0) { setHighlight(idx); if (!open) openList() }
  }

  const onKeyDown = (e) => {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); open ? move(1) : openList(); break
      case 'ArrowUp': e.preventDefault(); open ? move(-1) : openList(); break
      case 'Home': if (open) { e.preventDefault(); setHighlight(0) } break
      case 'End': if (open) { e.preventDefault(); setHighlight(filtered.length - 1) } break
      case 'Enter':
        e.preventDefault()
        if (open && highlight >= 0 && filtered[highlight]) pick(filtered[highlight])
        else if (!open) openList()
        break
      case ' ':
        if (!searchable) { e.preventDefault(); open ? (highlight >= 0 && pick(filtered[highlight])) : openList() }
        break
      case 'Escape': if (open) { e.preventDefault(); setOpen(false); buttonRef.current?.focus() } break
      case 'Tab': setOpen(false); break
      default:
        if (e.key.length === 1 && !searchable) handleTypeahead(e.key)
    }
  }

  const triggerCls = size === 'sm'
    ? 'flex w-full items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs text-left focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
    : 'input flex items-center gap-2 text-left'
  const borderCls = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
    : size === 'sm' ? 'border-gray-200' : ''
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        className={`${triggerCls} ${borderCls} ${disabledCls}`}
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`flex-1 truncate ${selected ? '' : 'text-gray-400'}`}>
          {selected
            ? (renderTrigger ? renderTrigger(selected) : selected.label)
            : placeholder}
        </span>
        <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 min-w-full w-max max-w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <input
                ref={searchRef}
                className="input text-sm"
                placeholder="Search…"
                value={query}
                onChange={e => { setQuery(e.target.value); setHighlight(0) }}
              />
            </div>
          )}
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No matches.</li>
            )}
            {filtered.map((opt, idx) => {
              const isSelected = options.indexOf(opt) === selectedIndex
              return (
                <li key={opt.key ?? `${opt.value}-${idx}`} data-idx={idx}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    className={[
                      'flex w-full items-center gap-2 px-3 text-left',
                      size === 'sm' ? 'py-1 text-xs' : 'py-1.5 text-sm',
                      opt.disabled ? 'text-gray-300 cursor-not-allowed'
                        : idx === highlight ? 'bg-blue-50 text-gray-800'
                        : 'text-gray-700',
                      isSelected ? 'font-medium' : '',
                    ].join(' ')}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => pick(opt)}
                  >
                    {opt.render ?? (
                      <span className="flex-1 truncate">
                        {opt.label}
                        {opt.sublabel && <span className="ml-1.5 text-xs text-gray-400">{opt.sublabel}</span>}
                      </span>
                    )}
                    {isSelected && (
                      <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd"
                          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.79 6.8-6.8a1 1 0 011.4 0z" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
