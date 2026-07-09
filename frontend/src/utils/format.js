import { format as formatDate, parseISO } from 'date-fns'

// Single source of truth for display formatting. Import from here instead of
// re-declaring `fullName` / `inr` helpers per page. See docs/frontend-standards.md.

/** "First Middle Last", skipping blank parts. Works for patients and doctors. */
export const fullName = (person) =>
  [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ')

/** Doctor display name with the "Dr." prefix. */
export const doctorName = (doctor) => `Dr. ${fullName(doctor)}`

/** Indian Rupee currency, always two decimals. */
export const inr = (value) =>
  '₹' + Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Short, human id for a UUID (first 8 chars, uppercase) — e.g. table cells. */
export const shortId = (id) => String(id ?? '').slice(0, 8).toUpperCase()

const asDate = (value) => (typeof value === 'string' ? parseISO(value) : new Date(value))

/** Date only, e.g. "9 Jul 2026". */
export const formatDay = (value) => (value ? formatDate(asDate(value), 'd MMM yyyy') : '—')

/** Date + time, e.g. "9 Jul 2026, 2:30 PM". */
export const formatDateTime = (value) => (value ? formatDate(asDate(value), 'd MMM yyyy, h:mm a') : '—')
