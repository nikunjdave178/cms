import { useEffect, useMemo, useRef, useState } from 'react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad = (n) => String(n).padStart(2, '0')
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const formatDisplay = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

// Accepts dd/mm/yyyy, dd-mm-yyyy or yyyy-mm-dd typed input; year must be 4 digits.
function parseTyped(text) {
  const t = text.trim()
  let d, m, y
  let match = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(t)
  if (match) { [, d, m, y] = match }
  else {
    match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
    if (match) { [, y, m, d] = match }
    else return null
  }
  y = Number(y); m = Number(m); d = Number(d)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return { y, m: m - 1, d }
}

/**
 * Custom date picker: masked dd/mm/yyyy typing + calendar popover with
 * month/year dropdown navigation, constrained to [minYear, maxDate].
 * `value`/`onChange` use ISO yyyy-mm-dd strings.
 */
export default function DatePicker({
  value, onChange, minYear = 1900, maxDate = new Date(), required = false,
  placeholder = 'DD/MM/YYYY', className = '', id,
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(formatDisplay(value))
  const today = new Date()
  const max = maxDate ?? today
  const maxIso = toIso(max.getFullYear(), max.getMonth(), max.getDate())

  const initial = value ? new Date(value) : max
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const rootRef = useRef(null)

  useEffect(() => { setText(formatDisplay(value)) }, [value])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const years = useMemo(() => {
    const list = []
    for (let y = max.getFullYear(); y >= minYear; y--) list.push(y)
    return list
  }, [minYear, max])

  const commitTyped = (t) => {
    if (!t.trim()) { onChange(''); return }
    const parsed = parseTyped(t)
    if (!parsed || parsed.y < minYear) { setText(formatDisplay(value)); return }
    const iso = toIso(parsed.y, parsed.m, parsed.d)
    if (iso > maxIso) { setText(formatDisplay(value)); return }
    onChange(iso)
    setViewYear(parsed.y)
    setViewMonth(parsed.m)
  }

  const selectDay = (day) => {
    const iso = toIso(viewYear, viewMonth, day)
    if (iso > maxIso) return
    onChange(iso)
    setOpen(false)
  }

  const moveMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    if (d.getFullYear() < minYear || d.getFullYear() > max.getFullYear()) return
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={id}
          className={`input pr-9 ${className}`}
          placeholder={placeholder}
          required={required}
          value={text}
          maxLength={10}
          inputMode="numeric"
          onChange={e => setText(e.target.value.replace(/[^\d/\-.]/g, ''))}
          onBlur={e => commitTyped(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitTyped(text) } }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Open calendar"
          className="absolute inset-y-0 right-0 px-2.5 text-gray-400 hover:text-blue-600"
          onClick={() => setOpen(o => !o)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <button type="button" onClick={() => moveMonth(-1)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Previous month">‹</button>
            <select
              className="flex-1 rounded-md border border-gray-200 px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={viewMonth}
              onChange={e => setViewMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              className="w-24 rounded-md border border-gray-200 px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={viewYear}
              onChange={e => setViewYear(Number(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={() => moveMonth(1)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400 mb-1">
            {WEEKDAYS.map(d => <span key={d} className="py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 text-center text-sm">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} />
              const iso = toIso(viewYear, viewMonth, day)
              const disabled = iso > maxIso
              const selected = iso === value
              const isToday = iso === toIso(today.getFullYear(), today.getMonth(), today.getDate())
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={[
                    'mx-auto h-8 w-8 rounded-full leading-8 transition-colors',
                    selected ? 'bg-blue-600 text-white font-semibold'
                      : disabled ? 'text-gray-300 cursor-not-allowed'
                      : isToday ? 'border border-blue-400 text-blue-600 hover:bg-blue-50'
                      : 'text-gray-700 hover:bg-blue-50',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
            <button type="button" className="text-xs text-gray-500 hover:text-red-600"
              onClick={() => { onChange(''); setOpen(false) }}>
              Clear
            </button>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700"
              onClick={() => {
                setViewYear(today.getFullYear()); setViewMonth(today.getMonth())
                if (toIso(today.getFullYear(), today.getMonth(), today.getDate()) <= maxIso)
                  selectDay(today.getDate())
              }}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
