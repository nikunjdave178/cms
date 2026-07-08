import { useEffect, useMemo, useRef, useState } from 'react'
import Select from './Select'
import { parseSegments, maskDateText, validateSegments, toIso } from '../utils/dateMask'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const formatDisplay = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

/**
 * Standard date field: types like a mask (slashes added automatically,
 * validated as you go) with a calendar popover, constrained to
 * [minYear, maxDate]. `value`/`onChange` use ISO yyyy-mm-dd strings.
 * `error` is the form-level message; typing errors take precedence.
 */
export default function DatePicker({
  value, onChange, minYear = 1900, maxDate = new Date(),
  placeholder = 'DD/MM/YYYY', error = null, id,
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(formatDisplay(value))
  const [typeError, setTypeError] = useState(null)
  const today = new Date()
  const max = maxDate ?? today
  const maxIso = toIso(max.getFullYear(), max.getMonth(), max.getDate())

  const initial = value ? new Date(value) : max
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const rootRef = useRef(null)
  const lastEmitted = useRef(value)

  const emit = (v) => { lastEmitted.current = v; onChange(v) }

  // Sync from external value changes only — never wipe in-progress typing.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value
      setText(formatDisplay(value))
      setTypeError(null)
    }
  }, [value])

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

  const handleTyping = (e) => {
    const masked = maskDateText(e.target.value, e.target.value.length < text.length)
    setText(masked)
    const segs = parseSegments(masked)
    const err = validateSegments(segs, minYear, maxIso)
    setTypeError(err)

    const complete = segs.d.length === 2 && segs.m.length === 2 && segs.y.length === 4
    if (complete && !err) {
      const iso = toIso(Number(segs.y), Number(segs.m) - 1, Number(segs.d))
      emit(iso)
      setViewYear(Number(segs.y))
      setViewMonth(Number(segs.m) - 1)
    } else {
      emit('')
    }
  }

  const handleBlur = () => {
    if (!text) { setTypeError(null); return }
    const { d, m, y } = parseSegments(text)
    if (!typeError && (d.length < 2 || m.length < 2 || y.length < 4))
      setTypeError('Enter a complete date (DD/MM/YYYY).')
  }

  const selectDay = (day) => {
    const iso = toIso(viewYear, viewMonth, day)
    if (iso > maxIso) return
    emit(iso)
    setText(formatDisplay(iso))
    setTypeError(null)
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
  const message = typeError ?? error

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={id}
          className={`input pr-9 ${message ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}`}
          placeholder={placeholder}
          value={text}
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
          onChange={handleTyping}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
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
      {message && <p className="mt-1 text-xs text-red-600">{message}</p>}

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <button type="button" onClick={() => moveMonth(-1)}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Previous month">‹</button>
            <Select
              size="sm"
              className="flex-1"
              value={viewMonth}
              onChange={v => setViewMonth(Number(v))}
              options={MONTHS.map((m, i) => ({ value: i, label: m }))}
            />
            <Select
              size="sm"
              className="w-[4.75rem]"
              value={viewYear}
              onChange={v => setViewYear(Number(v))}
              options={years.map(y => ({ value: y, label: String(y) }))}
            />
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
              onClick={() => { emit(''); setText(''); setTypeError(null); setOpen(false) }}>
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
