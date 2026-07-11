# Architecture & Engineering Standards

This is the reference for **how we build the Clinic Management System (CMS)**. It
exists so the codebase stays consistent, readable, and scalable as it grows —
new work should look like it was written by the same person who wrote the last
feature. When in doubt, follow the pattern documented here; if a better pattern
emerges, change the doc *and* the code together.

> **Golden rule:** consistency beats cleverness. A slightly worse pattern applied
> everywhere is better than five good patterns applied once each.

## Contents

- [Principles](#principles) — the values every decision serves
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Cross-cutting standards](#cross-cutting-standards) — identifiers, errors, auth, config, git
- [Frontend standards →](./frontend-standards.md)
- [Backend standards →](./backend-standards.md)
- [Conformance & alignment backlog](#conformance--alignment-backlog)

---

## Principles

1. **One way to do a thing.** Shared components and helpers over copy-paste. If
   you write the same 5 lines twice, extract them.
2. **Human-readable first.** Clear names, small functions, obvious data flow.
   Code is read far more than it is written.
3. **Scalable by default.** Paginate lists, index lookups, keep hot paths cheap
   (int FKs internally, UUIDs only at the edges — see [Identifiers](#identifiers)).
4. **Thin edges, clear layers.** Controllers and components handle their layer's
   job and delegate the rest. No business logic in a button; no HTTP concerns in
   a query.
5. **Validated everywhere it matters.** Client validation for UX, server
   validation for truth. Never trust the client.
6. **Fast to build on.** Conventions and primitives should make the common case
   (a new list/detail/form screen, a new CRUD endpoint) a fill-in-the-blanks job.
7. **Secure and boring.** Standard auth, standard error shapes, no secrets in the
   repo, least-privilege roles.

---

## Tech stack

| Layer      | Choice                                        | Notes |
|------------|-----------------------------------------------|-------|
| Frontend   | React 18 + Vite, JavaScript (JSX)             | SPA, React Router v6 |
| Styling    | Tailwind CSS + component classes + semantic tokens | See [frontend § Theme](./frontend-standards.md#theme) |
| FE data    | axios + a thin `api/` layer, cached hooks     | TanStack Query is the future direction (see backlog) |
| Charts     | Recharts                                      | Dashboards / Reports |
| Backend    | ASP.NET Core (net10.0), C#                    | Controllers + EF Core |
| ORM/DB     | EF Core 10 + PostgreSQL 16                    | Code-first migrations |
| Auth       | JWT bearer, role-based                        | See [Auth](#authentication--authorization) |
| Hosting    | Render (backend, auto-deploy on `master`), Vercel (frontend) | |

---

## Repository layout

```
cms/
├── backend/CmsApi/
│   ├── Controllers/      # HTTP endpoints (thin)
│   ├── Services/         # business logic beyond simple CRUD (introduce as needed)
│   ├── DTOs/             # request/response records — the API contract
│   ├── Models/           # EF entities + constants (Roles, StaticValueIds)
│   ├── Data/             # AppDbContext, seeders, EF helpers
│   │   └── Seed/         # seed data files (e.g. pincodes.csv)
│   ├── Migrations/       # EF migrations (never edit an applied one)
│   └── Program.cs        # composition root
├── frontend/src/
│   ├── api/              # one module per resource, wraps axios
│   ├── components/       # shared UI (see frontend § Components)
│   ├── context/          # React context providers (Auth)
│   ├── hooks/            # reusable hooks (useStaticValues, …)
│   ├── pages/<module>/   # feature screens grouped by domain
│   ├── constants/        # roles, status maps, enums
│   ├── data/             # static datasets (countries, pincodes fallback)
│   └── utils/            # pure helpers (format, dateMask)
├── scripts/              # one-off tooling (data cleaning, imports)
└── docs/                 # you are here
```

---

## Cross-cutting standards

### Identifiers

The rule for every **business entity** (Patient, Doctor, Appointment, Invoice,
InvoiceItem, Vitals, User):

- **Internal:** sequential `int Id` primary key. FKs reference it. Cheap joins,
  compact indexes, good locality.
- **External:** a `Guid PublicId` (unique index, `gen_random_uuid()` default) is
  the **only** id exposed by the API, routes, and JWT claims.
- Incoming UUIDs are resolved to the int key **once** per request via
  `DbSet.ResolveIdAsync(publicId)` (see `Data/PublicIdExtensions.cs`), then all
  filtering/joining happens on int columns.

**Lookup / config tables** (StaticValue, PincodeEntry) use an `int` PK only — no
PublicId — because their ids are stable, small, and never user-facing as secrets.

Rationale: UUIDs at the edge prevent enumeration and decouple the API from row
counts; int PKs internally keep the database fast at scale. This is non-negotiable
for new entities — see [backend § Database](./backend-standards.md#database-conventions).

### Errors

One error shape across the whole API: **RFC 7807 `ProblemDetails`**.

- Field validation → `ValidationProblem(ModelState)` → `{ errors: { Field: [msg] } }`.
- Business/looked-up failures → `BadRequest("message")` / `NotFound()` / `Conflict("message")`.
- The frontend axios client normalizes both: field errors become `error.fields`
  (mapped onto form inputs), everything else becomes `error.message` (shown as a
  banner). See [frontend § Forms](./frontend-standards.md#forms).

### Authentication & authorization

- JWT bearer. Token carries `sub`/`nameidentifier` = user **PublicId**, plus
  `role`.
- Controllers are `[Authorize]` by default; open endpoints are explicit
  (`login`, `/health`). Role gates use the `Roles` constants
  (`[Authorize(Roles = Roles.AdminReceptionist)]`) — never inline string literals.
- Frontend mirrors roles in `constants/roles.js`; route guards via `<RequireAuth roles={[…]}>`.
- Three roles: **Admin, Doctor, Receptionist**. Keep role checks coarse and
  centralized.

### Configuration & secrets

- No secrets in the repo. Connection strings, JWT keys, and allowed origins come
  from `appsettings.json` (local dev only) / environment variables (deployed).
- CORS origins are env-driven (`AllowedOrigins`, comma-separated).
- Any new secret is an env var documented in `SETUP.md`, never hardcoded.

### Git & delivery

- Work happens on **`dev`**. Commit there freely.
- **`master` auto-deploys to production.** Only merge `dev → master` when the
  user explicitly confirms; prefer a fast-forward so history stays linear.
- Commit messages: imperative subject, a body explaining *why* for non-trivial
  changes, and the `Co-Authored-By` trailer.
- One migration per schema change, descriptive name, data backfills inline.

---

## Conformance & alignment backlog

These standards describe the **target**. Most of the codebase already conforms
(identifiers, error shape, DTO records, the `Select`/`Combobox`/`DatePicker`
primitives, validation). The following are known gaps to close incrementally —
**new code must meet the standard; existing code is migrated opportunistically**,
not in one risky sweep.

| # | Gap | Standard | Priority |
|---|-----|----------|----------|
| 1 | List endpoints return unbounded arrays | `PagedResponse<T>` + `page/pageSize/sort/search` ([backend](./backend-standards.md#pagination-filtering-sorting)) | High |
| 2 | `.btn-primary`/`.input` in `index.css` still use raw `blue-*` (nav surfaces migrated to `primary-*`) | One `primary` token; migrate remaining `blue-*` → `primary-*` | Medium |
| 3 | `fullName`, `inr`, status-badge maps duplicated per page | Import from `utils/format.js` and `constants/status.js` | Medium |
| 4 | ~~InvoiceList has an inline modal~~ Generic `Modal` primitive built (`ConfirmModal`/`MenuModal` both use it); `InvoiceList`'s "Mark Paid" inline modal still not migrated | Use the shared `Modal` primitive | Low |
| 5 | No `UpdatedAt`/audit columns | `IAuditable` base + interceptor ([backend](./backend-standards.md#auditing)) | Medium |
| 6 | No API versioning | `api/v1/...` prefix when the first breaking change is needed | Low |
| 7 | FE data fetching is hand-rolled `useEffect` | Adopt TanStack Query for caching/retries/invalidation | Medium |
| 8 | Business logic lives in controllers | Extract to `Services/` once a controller exceeds simple CRUD+validation | Ongoing |

Close a row → update the table. When the table is empty, the codebase fully
conforms.
