# Stops the CMS backend + frontend dev servers started by start-local.ps1, and the
# WSL keep-alive process. Does not touch WSL/Postgres itself (it will idle-shut-down
# on its own once nothing holds it open).

function Stop-ByPort($port, $label) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) {
        Write-Host "$label not running on :$port." -ForegroundColor Yellow
        return
    }
    $conns | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
        Write-Host "Stopping $label (PID $_)..."
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
}

Stop-ByPort 5000 "Backend"
Stop-ByPort 5173 "Frontend"

Get-CimInstance Win32_Process -Filter "Name='wsl.exe'" |
    Where-Object { $_.CommandLine -like "*sleep infinity*" } |
    ForEach-Object {
        Write-Host "Stopping WSL keep-alive (PID $($_.ProcessId))..."
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

Write-Host "Done."
