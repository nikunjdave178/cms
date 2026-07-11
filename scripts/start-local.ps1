# Starts the CMS backend + frontend for local dev and keeps WSL's Postgres cluster
# alive. Safe to run manually, and registered (via register-autostart.ps1) to run
# automatically at Windows logon.
#
# Why the WSL keep-alive: the WSL2 lightweight VM tears itself (and Postgres) down
# a short while after the last attached `wsl` process exits, then cold-boots again
# on next access. That causes intermittent "connection refused"/"connection
# aborted" errors from the backend if nothing holds a session open. Launching
# `wsl -d Ubuntu -- sleep infinity` in the background prevents that for as long as
# this script's processes are alive.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logDir = "$root\.local-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-PortOpen($port) {
    return $null -ne (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

Write-Host "== Waking WSL Ubuntu / Postgres ==" -ForegroundColor Cyan
wsl -d Ubuntu -- bash -c "pg_isready -h localhost -p 5432" *> $null
Start-Process -FilePath "wsl.exe" -ArgumentList "-d Ubuntu -- sleep infinity" -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(30)
do {
    Start-Sleep -Seconds 1
    wsl -d Ubuntu -- bash -c "pg_isready -h localhost -p 5432 -q" *> $null
    $pgReady = $LASTEXITCODE -eq 0
} until ($pgReady -or (Get-Date) -gt $deadline)

if ($pgReady) {
    Write-Host "Postgres is up." -ForegroundColor Green
} else {
    Write-Host "Postgres did not come up within 30s; backend may fail to start." -ForegroundColor Yellow
}

Write-Host "`n== Backend ==" -ForegroundColor Cyan
if (Test-PortOpen 5000) {
    Write-Host "Already running on :5000, skipping." -ForegroundColor Yellow
} else {
    Push-Location "$root\backend\CmsApi"
    try {
        Write-Host "Building..."
        dotnet build -c Debug | Out-Null
        Write-Host "Starting (dotnet CmsApi.dll — the built .exe is blocked by App Control)..."
        Start-Process -FilePath "dotnet" `
            -ArgumentList "bin/Debug/net10.0/CmsApi.dll --urls http://localhost:5000" `
            -WorkingDirectory "$root\backend\CmsApi" `
            -WindowStyle Hidden `
            -RedirectStandardOutput "$logDir\backend.log" `
            -RedirectStandardError "$logDir\backend.err.log"
    } finally {
        Pop-Location
    }
}

Write-Host "`n== Frontend ==" -ForegroundColor Cyan
if (Test-PortOpen 5173) {
    Write-Host "Already running on :5173, skipping." -ForegroundColor Yellow
} else {
    Write-Host "Starting (npm run dev)..."
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c npm run dev" `
        -WorkingDirectory "$root\frontend" `
        -WindowStyle Hidden `
        -RedirectStandardOutput "$logDir\frontend.log" `
        -RedirectStandardError "$logDir\frontend.err.log"
}

Write-Host "`nBackend:  http://localhost:5000/health"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Logs:     $logDir"
