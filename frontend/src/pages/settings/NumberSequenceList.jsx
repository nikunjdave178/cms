import { useEffect, useState } from 'react'
import { getNumberSequences, updateNumberSequence } from '../../api/settings'
import Select from '../../components/Select'
import Spinner from '../../components/Spinner'

const PADDING_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1).map(n => ({
  value: String(n),
  label: `${n} digit${n > 1 ? 's' : ''} (${'0'.repeat(n - 1)}1)`,
}))

const preview = (prefix, suffix, value, padding) =>
  `${prefix || ''}${String(value).padStart(padding, '0')}${suffix || ''}`

function SequenceCard({ seq, onSaved }) {
  const [prefix, setPrefix] = useState(seq.prefix ?? '')
  const [suffix, setSuffix] = useState(seq.suffix ?? '')
  const [paddingWidth, setPaddingWidth] = useState(String(seq.paddingWidth))
  const [currentValue, setCurrentValue] = useState(String(seq.currentValue))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const dirty = prefix !== (seq.prefix ?? '') || suffix !== (seq.suffix ?? '') ||
    Number(paddingWidth) !== seq.paddingWidth || Number(currentValue) !== seq.currentValue

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updateNumberSequence(seq.entityType, {
        prefix: prefix.trim() || null,
        suffix: suffix.trim() || null,
        paddingWidth: Number(paddingWidth),
        currentValue: Number(currentValue) || 0,
      })
      onSaved(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <h4 className="font-semibold text-gray-800">{seq.displayName}</h4>
        <p className="text-xs text-gray-400 mt-0.5">Entity type: {seq.entityType}</p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Prefix</label>
          <input className="input" value={prefix} onChange={e => setPrefix(e.target.value)} maxLength={20} placeholder="e.g. PAT-" />
        </div>
        <div>
          <label className="label">Suffix</label>
          <input className="input" value={suffix} onChange={e => setSuffix(e.target.value)} maxLength={20} placeholder="Optional" />
        </div>
        <div>
          <label className="label">Number Padding</label>
          <Select value={paddingWidth} onChange={setPaddingWidth} options={PADDING_OPTIONS} />
        </div>
        <div>
          <label className="label">Current Value</label>
          <input
            className="input" type="number" min="0" step="1"
            value={currentValue}
            onChange={e => setCurrentValue(e.target.value.replace(/[^\d]/g, ''))}
          />
          <p className="mt-1 text-xs text-gray-400">Last number issued — the next one generated will be {(Number(currentValue) || 0) + 1}.</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Next number: <span className="font-mono font-semibold text-primary-700">
            {preview(prefix, suffix, (Number(currentValue) || 0) + 1, Number(paddingWidth))}
          </span>
        </p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-success-600">Saved</span>}
          <button className="btn-primary text-sm" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NumberSequenceList() {
  const [sequences, setSequences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getNumberSequences().then(setSequences).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const handleSaved = (updated) => {
    setSequences(prev => prev.map(s => s.entityType === updated.entityType ? updated : s))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Auto Number Setup</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure the prefix, suffix, and numbering scheme used to auto-generate
          reference numbers (Patient Number, Invoice Number, …) throughout the app.
        </p>
      </div>
      {error && <p className="text-danger-600 text-sm">{error}</p>}
      <div className="space-y-4">
        {sequences.map(seq => <SequenceCard key={seq.entityType} seq={seq} onSaved={handleSaved} />)}
      </div>
    </div>
  )
}
