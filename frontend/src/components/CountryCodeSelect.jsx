import { useMemo } from 'react'
import Select from './Select'
import { COUNTRIES_INDIA_FIRST, findCountryByDial, flagUrl } from '../data/countries'

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

/** Country dial-code dropdown (standard Select) showing flag + code + name. */
export default function CountryCodeSelect({ value, onChange, error = false, className = '' }) {
  const selected = findCountryByDial(value)

  const options = useMemo(() => COUNTRIES_INDIA_FIRST.map(c => ({
    value: c.dial,
    key: `${c.iso2}${c.dial}`,
    label: c.dial,
    searchText: `${c.name} ${c.iso2}`,
    render: (
      <>
        <Flag iso2={c.iso2} emoji={c.flag} />
        <span className="w-14 shrink-0 text-gray-700">{c.dial}</span>
        <span className="truncate text-gray-600">{c.name}</span>
      </>
    ),
  })), [])

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      searchable
      error={error}
      className={className}
      placeholder="Code"
      renderTrigger={() => selected && (
        <span className="flex items-center gap-2">
          <Flag iso2={selected.iso2} emoji={selected.flag} />
          <span className="font-medium">{selected.dial}</span>
        </span>
      )}
    />
  )
}
