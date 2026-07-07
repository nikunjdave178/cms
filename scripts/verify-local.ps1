# Quick local verification gate: run this before pushing to master.
# Checks Postgres is reachable, then builds both projects. Not a test suite -
# it just proves the code compiles before you click through the app by hand.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "== Checking Postgres (WSL Ubuntu) ==" -ForegroundColor Cyan
$pgStatus = wsl -d Ubuntu -- bash -c "pg_lsclusters 2>/dev/null | grep -w online" 2>$null
if (-not $pgStatus) {
    Write-Host "Postgres cluster not detected as online in WSL." -ForegroundColor Yellow
    Write-Host "Start it with: wsl -d Ubuntu -- sudo service postgresql start" -ForegroundColor Yellow
} else {
    Write-Host "Postgres is up: $pgStatus" -ForegroundColor Green
}

Write-Host "`n== Building backend ==" -ForegroundColor Cyan
Push-Location "$root/backend/CmsApi"
try {
    dotnet build
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed." }
} finally {
    Pop-Location
}

Write-Host "`n== Building frontend ==" -ForegroundColor Cyan
Push-Location "$root/frontend"
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed." }
} finally {
    Pop-Location
}

Write-Host "`n== Both builds passed ==" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  1. Start backend:  cd backend/CmsApi && dotnet watch run   (auto-reloads on save)"
Write-Host "  2. Start frontend: cd frontend && npm run dev              (already has HMR)"
Write-Host "  3. Click through the feature you changed at http://localhost:5173"
Write-Host "  4. If it looks right, commit and push to master to deploy."
