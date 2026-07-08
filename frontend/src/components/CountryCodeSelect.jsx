import { useEffect, useMemo, useRef, useState } from 'react'
import { COUNTRIES, COUNTRIES_INDIA_FIRST, findCountryByDial, flagUrl } from '../data/countries'

function Flag({ iso2, emoji }) {
  return (
    <span className="inline-flex w-6 justify-center shrink-0">
      <img
        src={flagUrl(iso2)}
        alt=""
        loading="lazy"
        className="h-3.5 w-5 rounded-[2px] object-cover shadow-sm"
        onError={e => {
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextSibling.style.display = 'inline'
        }}
      />
      <span style={{ display: 'none' }}>{emoji}</span>
    </span>
  )
}

/** Searchable country dial-code dropdown showing flag + code + country name. */
export default function CountryCodeSelect({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)

  const selected = findCountryByDial(value)

  useEffect(() => {
    if (!open) return
    setQuery('')
    searchRef.current?.focus()
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES_INDIA_FIRST
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.dial.replace('+', '').startsWith(q.replace('+', '')) ||
      c.iso2.toLowerCase() === q)
  }, [query])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className="input flex items-center gap-2 text-left"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <Flag iso2={selected.iso2} emoji={selected.flag} />
            <span className="font-medium">{selected.dial}</span>
          </>
        ) : (
          <span className="text-gray-400">{value || 'Code'}</span>
        )}
        <span className="ml-auto text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              className="input text-sm"
              placeholder="Search country or code…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No matches.</li>
            )}
            {filtered.map(c => (
              <li key={`${c.iso2}${c.dial}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.dial === value}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-blue-50 ${
                    c.dial === value && selected?.iso2 === c.iso2 ? 'bg-blue-50 font-medium' : ''
                  }`}
                  onClick={() => { onChange(c.dial); setOpen(false) }}
                >
                  <Flag iso2={c.iso2} emoji={c.flag} />
                  <span className="w-14 shrink-0 text-gray-700">{c.dial}</span>
                  <span className="truncate text-gray-600">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
