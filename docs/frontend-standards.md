# Frontend Standards

React + Vite SPA. This doc defines how screens, components, state, and styling
are structured. Read [ARCHITECTURE.md](./ARCHITECTURE.md) first for the shared
principles and identifier/error/auth rules.

## Contents

- [Folder structure](#folder-structure)
- [Components](#components) — the taxonomy and the shared primitives
- [Screen archetypes](#screen-archetypes) — List / Detail / Form / Dashboard
- [Forms](#forms) — the canonical form pattern
- [Data layer](#data-layer)
- [Theme](#theme)
- [Naming & style](#naming--style)

---

## Folder structure

```
src/
├── api/            # one module per resource: getPatients, createPatient, …
├── components/     # shared, reusable UI (never imports from pages/)
├── context/        # React context providers
├── hooks/          # reusable hooks
├── pages/<module>/ # feature screens, grouped by domain (patients, billing, …)
├── constants/      # roles, status→badge maps, enums
├── data/           # static datasets (countries, pincode fallback)
└── utils/          # pure, framework-free helpers (format, dateMask)
```

Rules:
- `components/` and `utils/` **never import from `pages/`** (dependency flows one
  way: pages → components/hooks/api/utils).
- A helper used by 2+ pages moves to `utils/` or `constants/`. Don't copy it.
- One resource = one `api/<resource>.js` module.

---

## Components

Three tiers. Know which tier you're writing.

### 1. UI primitives (`components/`)

Generic, domain-agnostic, reusable anywhere. These are the design system. **Use
them instead of raw HTML controls** so every screen looks and behaves the same.

| Component | Use for | Key props |
|-----------|---------|-----------|
| `Select` | Any single-choice dropdown (replaces `<select>`) | `value, onChange, options[{value,label,sublabel?}], searchable, size, error` |
| `Combobox` | Free-text field with suggestions (zip, city, state) | `value, onChange, onSelect, options` |
| `CountryCodeSelect` | Phone dial code with flag | `value, onChange` |
| `DatePicker` | Any date input (masked dd/mm/yyyy + calendar) | `value, onChange, minYear, maxDate, error` |
| `Spinner` | Loading state | `className` |
| `Modal` | Generic modal shell (portal, escape/backdrop close, scroll lock) | `onClose, title?, size` |
| `ConfirmModal` | Destructive confirmation, built on `Modal` | `message, onConfirm, onCancel` |
| `MenuModal` | Full grouped/role-filtered nav listing, built on `Modal`, driven by `constants/nav.js` | `onClose` |

**`onChange` contract:** primitives call `onChange(value)` with the raw value,
not a DOM event. Form `set()` handlers accept either (`e?.target ? e.target.value : e`).

Missing primitives to add when first needed (keep them here, not per-page):
`Button`, `Input`, `TextArea`, `FormField` (label+control+error wrapper),
`Badge`, `Table`, `EmptyState`, `PageHeader`.

### 2. Layout (`components/`)

`Layout` (app shell: fixed-height flex row, scrolls `<main>` only), `Rail` (icon
rail — menu trigger opening `MenuModal`, fixed quick-access shortcuts from
`constants/nav.js`, expand/collapse/hide states persisted via `LayoutContext`, user
footer), `TabBar` (top tab strip — one tab per visited URL; also owns the
`useLocation` watcher that opens/activates a tab on every navigation). The shell is
`h-screen overflow-hidden`; only the content area scrolls — never the rail or the
tab bar. Don't reintroduce `min-h-screen` on the shell (it makes the whole page
scroll together).

Pages that want a live tab title (e.g. a detail screen showing the record's name
instead of a generic label) call `useTabTitle(title)` from `hooks/` once their data
loads.

### 3. Feature components (`pages/<module>/`)

Domain-specific screens and their local pieces. Compose primitives; don't
re-implement them.

---

## Screen archetypes

Almost every screen is one of four shapes. Follow the matching skeleton so all
screens of a kind are consistent.

### List / Index

Toolbar (search + filters + primary action) → `card` table → row actions →
delete via `ConfirmModal`.

```jsx
export default function ThingList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = (params) => {
    setLoading(true)
    getThings(params).then(setRows).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* search / <Select> filters */}
        <div className="flex-1" />
        <Link to="new" className="btn-primary">+ New Thing</Link>
      </div>
      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {loading ? <Spinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">{/* thead + tbody, EmptyState row when 0 */}</table>
        </div>
      )}
      {deleteTarget && (
        <ConfirmModal message={`Delete "${fullName(deleteTarget)}"?`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}
```

- Table header cells: `text-xs font-semibold text-gray-500 uppercase tracking-wide`.
- Status cells use `badgeClass(displayValue)` from `constants/status.js`.
- If a row contains a `Select` (e.g. inline status), the table wrapper is
  `overflow-visible` so the popover isn't clipped.

### Detail

Header (title + id + edit/delete actions) → info `card`(s) with labelled fields →
related-entity tables.

- Show ids as `shortId(entity.id)` (8-char uppercase), full uuid in `title=`.
- Use a small `Field` (label + value, `—` when empty) presentational component.

### Form (create + edit unified)

One component serves both routes (`new` and `:id/edit`, `isEdit = Boolean(id)`).
See [Forms](#forms) for the full pattern.

### Dashboard

Stat tiles (`card` grid) + Recharts charts. Guard against null API data with safe
defaults. Numbers via `inr()` / `toLocaleString`.

---

## Forms

The single form pattern — every form follows it:

```jsx
const empty = { /* every field, sensible defaults */ }

function validate(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Name is required.'
  // …one message per invalid field
  return errs
}

export default function ThingForm() {
  const { id } = useParams(); const isEdit = Boolean(id)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)      // form-level banner
  const [saving, setSaving] = useState(false)

  // set(field) accepts a DOM event OR a raw value (primitives pass values)
  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e?.target ? e.target.value : e }))
    setErrors(errs => ({ ...errs, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) { setError('Please fix the highlighted fields.'); return }
    setSaving(true)
    try {
      const payload = { /* trim strings, '' → null, Number() ids */ }
      isEdit ? await updateThing(id, payload) : await createThing(payload)
      navigate('..')
    } catch (e) {
      if (e.fields) { setErrors(mapServerFields(e.fields)); setError('Please fix the highlighted fields.') }
      else setError(e.message)
    } finally { setSaving(false) }
  }
}
```

Rules:
- **Client validates for UX, server validates for truth.** Mirror server rules
  but treat the server's `ValidationProblem` (`e.fields`) as authoritative —
  always map it back onto the fields.
- Inline errors via a `FieldError` element under each control; invalid inputs get
  the `border-danger-400 focus:border-danger-500 focus:ring-danger-500` treatment
  (or `error` prop on primitives).
- Submit is disabled while `saving`; button label reflects state.
- Payload construction trims strings, converts `''` → `null`, and casts id
  strings to `Number`.
- `noValidate` on the `<form>` (we own validation, not the browser).

---

## Data layer

- **`api/<resource>.js`**: thin functions returning `r.data`. No transformation,
  no error handling here — the axios client owns that.
  ```js
  export const getThings = (params) => client.get('/things', { params }).then(r => r.data)
  ```
- **`api/client.js`**: the one axios instance. Injects the bearer token,
  normalizes errors (field errors → `error.fields`, else `error.message`), and
  fires `cms:unauthorized` on a 401 to log out.
- **Static/lookup values** (gender, statuses, payment modes): `useStaticValues(code)` —
  cached, deduped. Never hardcode these lists in components.
- **Fetching pattern (interim):** `useEffect` + `useState` (`data`, `loading`,
  `error`). Consistent variable names. Target: migrate to TanStack Query for
  caching, retries, and invalidation (backlog #7).
- Never call `axios` or `fetch` directly from a component — always go through
  `api/`.

---

## Theme

**Colour comes from semantic tokens, never raw hex or raw palette names in new code.**
Tokens live in `tailwind.config.js`:

| Token | Meaning | Example |
|-------|---------|---------|
| `primary-*` | Brand, actions, links, focus, selected | `bg-primary-600`, `focus:ring-primary-500` |
| `success-*` | Positive (paid, completed, active) | `text-success-700` |
| `warning-*` | Attention (pending, due) | `bg-warning-100` |
| `danger-*` | Destructive, errors, cancelled | `btn-danger`, `text-danger-600` |
| `info-*` | Secondary accent (scheduled) | `bg-info-100` |

Reusable element styles are `@layer components` classes in `index.css`:
`btn` / `btn-primary` / `btn-secondary` / `btn-danger`, `input`, `label`, `card`,
`badge`. **Use these classes** rather than re-specifying padding/border/radius.

- Status badges: `badgeClass(displayValue)` from `constants/status.js` — don't
  redeclare colour maps per page.
- Radius scale: `rounded-lg` (controls/buttons), `rounded-xl` (cards/popovers),
  `rounded-full` (badges, calendar days).
- Spacing: forms use `space-y-5`, toolbars `gap-3`, field grids `gap-4`.
- One accent colour only. `blue-*` and `indigo-*` literals are legacy — new code
  uses `primary-*` (backlog #2).

---

## Naming & style

- Components `PascalCase.jsx`; hooks `useThing.js`; utils/api `camelCase.js`.
- Handlers `handleSubmit`, `handleDelete`; setters `set('field')`.
- State: `data/rows`, `loading`, `saving`, `error` (banner), `errors` (per-field).
- Prefer small pure helpers in `utils/` over inline logic in JSX.
- No default exports for utils/constants (named exports); components default-export.
- Keep JSX shallow — extract a local component when nesting gets deep.
