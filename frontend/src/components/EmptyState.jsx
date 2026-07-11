// Generic empty-state primitive (icon + title + description) — see
// docs/frontend-standards.md's "missing primitives" list. First used for the
// no-tabs-open placeholder in Layout.jsx; reusable later for empty list screens.
export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-primary-400" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-base font-semibold text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-400 max-w-sm">{description}</p>}
    </div>
  )
}
