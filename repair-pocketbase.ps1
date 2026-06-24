$ErrorActionPreference = "Stop"

$workspace = "D:\Users\19586\Documents\video IP igent"
node (Join-Path $workspace "repair-pocketbase.js")
Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/sync/from-pocketbase" -Method Post -TimeoutSec 60 | Out-Null
