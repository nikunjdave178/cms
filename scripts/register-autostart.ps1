# One-time setup: registers a Windows Scheduled Task that runs start-local.ps1 at
# every logon for the current user, launching the CMS backend + frontend (and
# waking WSL Postgres) hidden in the background. Re-run after moving the repo to
# refresh the stored script path.
#
# Undo: Unregister-ScheduledTask -TaskName "CMS Local Dev Autostart" -Confirm:$false

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$scriptPath = "$root\scripts\start-local.ps1"
$taskName = "CMS Local Dev Autostart"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "Registered scheduled task '$taskName' — it will run at your next Windows logon." -ForegroundColor Green
Write-Host "Run it now instead of waiting for next logon:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
Write-Host "Remove it:"
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
