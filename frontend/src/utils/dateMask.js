// Masking + validation helpers for keyboard entry of dd/mm/yyyy dates.

const pad2 = (s) => s.padStart(2, '0')
export const toIso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

/**
 * Split typed text into day/month/year segments. Digits flow into the next
 * segment once the current one is full; a typed separator completes the
 * current segment early (so "4/5/1990" becomes 04/05/1990).
 */
export function parseSegments(text) {
  let d = '', m = '', y = ''
  let seg = 0
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      if (seg === 0) { if (d.length < 2) d += ch; else { seg = 1; m += ch } }
      else if (seg === 1) { if (m.length < 2) m += ch; else { seg = 2; y += ch } }
      else if (y.length < 4) y += ch
    } else if ('/-.'.includes(ch)) {
      if (seg === 0 && d.length > 0) { d = pad2(d); seg = 1 }
      else if (seg === 1 && m.length > 0) { m = pad2(m); seg = 2 }
    }
  }
  return { d, m, y, seg }
}

// Re-render segments as dd/mm/yyyy, auto-appending the slash as a segment
// completes (but never while the user is deleting, so backspace works).
export function maskDateText(text, deleting) {
  const { d, m, y, seg } = parseSegments(text)
  let out = d
  if (seg >= 1) out = `${d}/${m}`
  if (seg >= 2) out = `${d}/${m}/${y}`
  if (!deleting) {
    if (seg === 0 && d.length === 2) out = `${d}/`
    else if (seg === 1 && m.length === 2) out = `${d}/${m}/`
  }
  return out
}

// Validate whatever has been typed so far; returns an error message or null.
export function validateSegments({ d, m, y }, minYear, maxIso) {
  if (d.length === 2 && (Number(d) < 1 || Number(d) > 31))
    return 'Day must be between 01 and 31.'
  if (m.length === 2 && (Number(m) < 1 || Number(m) > 12))
    return 'Month must be between 01 and 12.'
  if (y.length === 4) {
    const yn = Number(y), mn = Number(m), dn = Number(d)
    if (yn < minYear) return `Year must be ${minYear} or later.`
    const date = new Date(yn, mn - 1, dn)
    if (date.getFullYear() !== yn || date.getMonth() !== mn - 1 || date.getDate() !== dn)
      return 'This date does not exist.'
    if (toIso(yn, mn - 1, dn) > maxIso) return 'Date cannot be in the future.'
  }
  return null
}
