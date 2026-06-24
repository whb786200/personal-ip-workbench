$ErrorActionPreference = "Stop"

$workspace = "D:\Users\19586\Documents\video IP igent"

try {
  Invoke-RestMethod -Uri "http://127.0.0.1:8090/_/" -TimeoutSec 5 | Out-Null
} catch {
  & (Join-Path $workspace "run-workbench.ps1") | Out-Null
  Start-Sleep -Seconds 3
}

node (Join-Path $workspace "sync-pocketbase.js")
