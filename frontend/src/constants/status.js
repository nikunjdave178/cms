// Centralized badge styling for every status label in the app. Pages should
// use `badgeClass(displayValue)` instead of re-declaring per-page colour maps.
// Colours reference semantic theme tokens (see tailwind.config.js).

const STATUS_BADGE = {
  // Appointment status
  Scheduled: 'bg-info-100 text-info-700',
  Completed: 'bg-success-100 text-success-700',
  Cancelled: 'bg-danger-100 text-danger-700',
  'No Show': 'bg-slate-100 text-slate-600',
  // Invoice status
  Pending: 'bg-warning-100 text-warning-700',
  Paid: 'bg-success-100 text-success-700',
}

const FALLBACK = 'bg-gray-100 text-gray-600'

/** Full className for a status badge, e.g. `<span className={badgeClass(status)}>`. */
export const badgeClass = (displayValue) =>
  `badge ${STATUS_BADGE[displayValue] ?? FALLBACK}`
