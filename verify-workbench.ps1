$ErrorActionPreference = "Continue"

$workspace = "D:\Users\19586\Documents\video IP igent"
$checks = @()

function Add-Check {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )
  $script:checks += [pscustomobject]@{
    Name = $Name
    Ok = $Ok
    Detail = $Detail
  }
}

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/health" -TimeoutSec 10
  Add-Check "Workbench API" ($health.ok -eq $true) "http://127.0.0.1:8787"
} catch {
  Add-Check "Workbench API" $false $_.Exception.Message
}

try {
  $curl = & curl.exe -I --max-time 45 "http://127.0.0.1:8501" 2>&1
  Add-Check "MoneyPrinterTurbo" ($LASTEXITCODE -eq 0 -and (($curl -join "`n") -match "200 OK")) "http://127.0.0.1:8501"
} catch {
  Add-Check "MoneyPrinterTurbo" $false $_.Exception.Message
}

try {
  $curl = & curl.exe -I --max-time 45 "http://127.0.0.1:8090/_/" 2>&1
  Add-Check "PocketBase" ($LASTEXITCODE -eq 0 -and (($curl -join "`n") -match "200 OK")) "http://127.0.0.1:8090/_/"
} catch {
  Add-Check "PocketBase" $false $_.Exception.Message
}

try {
  $nodeCheck = & node --check (Join-Path $workspace "app.js") 2>&1
  Add-Check "Frontend JS" ($LASTEXITCODE -eq 0) ($nodeCheck -join "`n")
} catch {
  Add-Check "Frontend JS" $false $_.Exception.Message
}

try {
  $serverCheck = & node --check (Join-Path $workspace "server.js") 2>&1
  Add-Check "Server JS" ($LASTEXITCODE -eq 0) ($serverCheck -join "`n")
} catch {
  Add-Check "Server JS" $false $_.Exception.Message
}

try {
  $statePath = Join-Path $workspace "data\workbench-state.json"
  $taskCount = & node -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(!s.profile||!Array.isArray(s.tasks)){process.exit(2)}; console.log(s.tasks.length)" $statePath 2>&1
  Add-Check "State File" ($LASTEXITCODE -eq 0 -and [int]$taskCount -gt 0) "tasks=$taskCount"
} catch {
  Add-Check "State File" $false $_.Exception.Message
}

try {
  $syncOutput = & node (Join-Path $workspace "sync-pocketbase.js") 2>&1
  Add-Check "PocketBase Sync" ($LASTEXITCODE -eq 0 -and (($syncOutput -join "`n") -match '"ok": true')) (($syncOutput -join " ") -replace "\s+", " ")
} catch {
  Add-Check "PocketBase Sync" $false $_.Exception.Message
}

try {
  $admin = & curl.exe -I --max-time 45 "http://127.0.0.1:8787/admin-cn.html" 2>&1
  $tasks = & curl.exe --max-time 45 "http://127.0.0.1:8787/api/pb/content_tasks" 2>&1
  Add-Check "Chinese Admin" ($LASTEXITCODE -eq 0 -and (($admin -join "`n") -match "200 OK") -and (($tasks -join "`n") -match '"totalItems"')) "http://127.0.0.1:8787/admin-cn.html"
} catch {
  Add-Check "Chinese Admin" $false $_.Exception.Message
}

$checks | Format-Table -AutoSize

if ($checks.Ok -contains $false) {
  exit 1
}
