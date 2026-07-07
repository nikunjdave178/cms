# Clinic Management System — Setup Guide

## Prerequisites

Install these before running the project:

| Tool | Download |
|------|----------|
| .NET 10 SDK | https://dotnet.microsoft.com/download/dotnet/10.0 |
| Node.js 20+ | https://nodejs.org |
| PostgreSQL 15+ | https://www.postgresql.org/download |

## 1. Database

Create the database in PostgreSQL:
```sql
CREATE DATABASE cms_db;
```

Update the connection string in `backend/CmsApi/appsettings.json`:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=cms_db;Username=postgres;Password=YOUR_PASSWORD"
```

## 2. Backend

```bash
cd backend/CmsApi
dotnet restore
dotnet watch run
```

The API starts on **http://localhost:5000**.
Scalar API UI is available at **http://localhost:5000/scalar**.
EF Core migrations are applied automatically on first startup, along with a seeded admin login (`admin@clinic.local` / `Admin@123` — change this after your first deploy).

Use `dotnet watch run` instead of `dotnet run` during development — it rebuilds and restarts automatically on save, same as Vite's hot reload on the frontend.

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**. All routes except `/login` require signing in.

## 4. Verifying changes before pushing

Run `./scripts/verify-local.ps1` (PowerShell) before pushing to `master` — it checks Postgres is reachable and builds both projects. There's no automated test suite yet, so click through the feature you changed in the browser afterward. `master` auto-deploys to Render (backend) and Vercel (frontend) on push, so this is the last check before it goes live.

## Project Structure

```
cms/
├── backend/
│   └── CmsApi/
│       ├── Controllers/      # API endpoints
│       ├── Data/             # EF Core DbContext
│       ├── DTOs/             # Request/Response records
│       ├── Models/           # Domain entities
│       └── Program.cs
└── frontend/
    └── src/
        ├── api/              # Axios API helpers
        ├── components/       # Layout, Sidebar, Spinner, ConfirmModal
        └── pages/
            ├── Dashboard.jsx
            ├── patients/     # List, Form, Detail
            ├── appointments/ # List, Form
            ├── billing/      # List, Form
            └── doctors/      # List, Form
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/patients | List / search patients |
| POST | /api/patients | Register patient |
| PUT | /api/patients/{id} | Update patient |
| DELETE | /api/patients/{id} | Delete patient |
| GET | /api/doctors | List doctors |
| POST | /api/doctors | Add doctor |
| GET | /api/appointments | List appointments (filterable) |
| POST | /api/appointments | Book appointment |
| PUT | /api/appointments/{id} | Update appointment |
| GET | /api/billing | List invoices |
| POST | /api/billing | Create invoice |
| PATCH | /api/billing/{id}/status | Mark paid/cancelled |
| GET | /api/dashboard/stats | Dashboard summary |
| POST | /api/auth/login | Log in, returns JWT |
| GET | /api/auth/me | Current logged-in user |
| GET | /api/users | List staff accounts (Admin only) |
| GET | /health | Unauthenticated health check (used by Render) |
