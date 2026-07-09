# Backend Standards

ASP.NET Core (net10.0) + EF Core + PostgreSQL. This doc defines API shape, layer
responsibilities, and database conventions. Read
[ARCHITECTURE.md](./ARCHITECTURE.md) first for the shared identifier/error/auth
rules.

## Contents

- [Layering](#layering)
- [API conventions](#api-conventions) — routing, verbs, status codes, DTOs, errors
- [Pagination, filtering, sorting](#pagination-filtering-sorting)
- [Validation](#validation)
- [Database conventions](#database-conventions)
- [Migrations](#migrations)
- [Auth & config](#auth--config)

---

## Layering

```
HTTP → Controller → (Service) → DbContext → PostgreSQL
```

- **Controller** — owns the HTTP concern only: route, model binding, auth,
  triggering validation, mapping to a response, choosing the status code. Keep it
  thin. Primary-constructor DI: `public class PatientsController(AppDbContext db)`.
- **Service (`Services/`)** — introduce a service class the moment a controller
  needs logic beyond straight CRUD + simple validation: multi-entity workflows,
  calculations (e.g. invoice totals/GST), anything you'd want to unit-test or
  reuse. Simple CRUD may stay in the controller. Don't create empty pass-through
  services for their own sake.
- **DbContext** — the only thing that talks to the database. No raw SQL in
  controllers (seeding/backfills excepted).

Never put business rules in a DTO, or HTTP concerns (`ActionResult`, `ModelState`)
in a service — a service returns data or a typed result, the controller turns
that into HTTP.

---

## API conventions

### Routing

- `[Route("api/[controller]")]`, controllers plural (`PatientsController` →
  `/api/patients`).
- Nested resources for true ownership: `/api/appointments/{appointmentId:guid}/vitals`.
- Route ids are UUIDs with the `:guid` constraint: `[HttpGet("{id:guid}")]`.
- Actions: `GetAll`, `GetById`, `Create`, `Update`, `Delete` (+ domain verbs like
  `UpdateStatus`). Async methods, `async`/`await`, `...Async` for shared helpers.

### HTTP verbs & status codes

| Verb | Use | Success | Common failures |
|------|-----|---------|-----------------|
| GET | read | `200` (or `200` + `[]`) | `404` |
| POST | create | `201` + `CreatedAtAction(...)` | `400`, `409` |
| PUT | full update | `200` | `400`, `404` |
| PATCH | partial (e.g. status) | `200` | `400`, `404` |
| DELETE | remove | `204` | `404` |

- `400` validation/bad input, `401` unauthenticated, `403` wrong role, `404` not
  found, `409` conflict (duplicate email, vitals already recorded).
- `POST` returns the created resource + `CreatedAtAction(nameof(GetById), new { id = entity.PublicId }, ToResponse(...))`.

### DTOs — the API contract

- Requests and responses are **`record`s** in `DTOs/`. Entities are **never**
  serialized directly.
- Responses expose `PublicId` as `Id` (a `Guid`), plus display strings for
  related lookups (`GenderDisplay`, `StatusDisplay`) so the client needn't join.
- A private `ToResponse(entity)` mapper per controller is the standard (until a
  mapper/service justifies extraction).
- Requests carry UUIDs for related entities; the controller resolves them to int
  keys via `ResolveIdAsync` before persisting.

### Errors

RFC 7807 `ProblemDetails` — see [ARCHITECTURE § Errors](./ARCHITECTURE.md#errors).
- Field errors: `return ValidationProblem(ModelState);`
- Semantic errors: `BadRequest("Patient not found.")`, `NotFound()`,
  `Conflict("A user with this email already exists.")`.
- Don't invent bespoke error JSON — the frontend depends on this one shape.

---

## Pagination, filtering, sorting

**Target standard (backlog #1 — new list endpoints must adopt it).** List
endpoints must not return unbounded arrays; they page.

```csharp
public record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

// Query: ?page=1&pageSize=20&sort=-createdAt&search=foo
[HttpGet]
public async Task<PagedResponse<ThingResponse>> GetAll([FromQuery] PageQuery q) { … }
```

- `page` (1-based), `pageSize` (default 20, clamp to a max e.g. 100).
- `search` filters the sensible text columns (as Patients already does).
- `sort` is `field` / `-field` (leading `-` = descending); whitelist sortable fields.
- Always `OrderBy(...)` before `Skip/Take` for stable paging.

---

## Validation

Two layers, both required for anything user-facing:

1. **Field validation → data annotations on the request record.** Presence,
   length, format, range. Produces `ValidationProblem` automatically.
   ```csharp
   public record PatientRequest(
       [Required, MaxLength(100)] string FirstName,
       [RegularExpression(@"^\d{6,15}$")] string PhoneNumber, …);
   ```
2. **Business/referential rules → controller or service.** Cross-field checks,
   "does this FK exist", "is this a valid active lookup value", future-date
   guards. Add to `ModelState` and return `ValidationProblem(ModelState)`, or
   `BadRequest` for single-fact failures. (See `PatientsController.ValidateBusinessRules`.)

Trim strings and normalize `""`→`null` on write (`NullIfBlank`).

---

## Database conventions

### Keys & identifiers

- Business entities: `int Id` PK (identity) **and** `Guid PublicId` (unique index,
  `gen_random_uuid()` default). FKs use int. See
  [ARCHITECTURE § Identifiers](./ARCHITECTURE.md#identifiers). Configure via the
  shared `ConfigurePublicId<T>()` helper in `AppDbContext`.
- Lookup/config tables: `int` PK only.

### Lookup / reference data — pick the right tool

| Need | Use |
|------|-----|
| Small, fixed, business-meaningful set with a stable id (gender, statuses, payment modes) | `StaticType` + `StaticValue`, ids pinned in `StaticValueIds` |
| Large reference dataset (pincode directory) | A dedicated table + startup seeder from `Data/Seed/*.csv` |
| Pure code branching, never stored/displayed | a C# `enum` |

Never scatter magic numbers — reference `StaticValueIds.InvoiceStatus.Paid`, not `17`.

### Money & precision

Configure in `OnModelCreating`, don't rely on defaults:
- Money: `decimal(18,2)`. Rates/percentages: `decimal(5,2)`. Vitals etc. sized to
  their real range.

### Auditing

- Every entity has `CreatedAt` (UTC).
- **Target (backlog #5):** an `IAuditable` (`CreatedAt`, `UpdatedAt`,
  `CreatedBy?`, `UpdatedBy?`) with a `SaveChanges` interceptor stamping them, so
  we get change tracking without per-entity boilerplate.

### Relationships & deletes

- Configure FKs and delete behaviour explicitly in `OnModelCreating`
  (`Restrict` for lookups, `Cascade`/`SetNull` where the domain wants it).
- Hard delete is the current policy. If an entity needs history/undo, introduce
  soft delete (`IsDeleted` + a global query filter) rather than ad-hoc flags.
- **Deleting a referenced entity is guarded by default.** Any FK left at
  `Restrict` (the default posture for business-entity relationships — e.g.
  Patient → Appointments, Patient → Invoices, Doctor → Appointments) is
  automatically checked by `DeleteGuardService.FindBlockingReferenceAsync` before
  the delete, returning a friendly message ("Patient Jane Doe cannot be deleted
  as it has been used in appointments.") via `409 Conflict` instead of a raw
  FK-violation. Every `Delete` action should call it:
  ```csharp
  if (await deleteGuard.FindBlockingReferenceAsync(patient, $"Patient {FullName(patient)}") is { } reason)
      return Conflict(reason);
  ```
  To let a relationship cascade or null out instead of blocking, configure that
  FK explicitly as `Cascade`/`SetNull` in `OnModelCreating` (see
  Appointment → Vitals, Invoice → Appointment) — the guard only checks FKs left
  at `Restrict`, so that's the opt-out.

---

## Migrations

- One migration per schema change; descriptive name (`AddPatientCountry`,
  `AddPincodeDirectory`).
- **Never edit a migration that has been applied anywhere.** Add a new one.
- Data backfills go **inside** the migration that needs them
  (`migrationBuilder.Sql("UPDATE ...")`), e.g. defaulting existing rows.
- Migrations apply automatically on startup (`db.Database.Migrate()` in
  `Program.cs`); large seeds run batched and idempotently (skip when already
  populated).
- Review the generated `Up`/`Down` before committing.

---

## Auth & config

- JWT bearer; `[Authorize]` by default, explicit `[AllowAnonymous]`-style
  exceptions only for `login`/`health`.
- Role gates use `Roles` constants and the combo strings
  (`Roles.AdminReceptionist`) — never inline `"Admin,Receptionist"`.
- Token subject = user `PublicId`; parse with `Guid.TryParse`, resolve to the
  entity by `PublicId`.
- Secrets/connection strings/JWT key/CORS origins come from configuration/env,
  never committed. New config keys are documented in `SETUP.md`.
- `/health` stays open for the platform health check.
