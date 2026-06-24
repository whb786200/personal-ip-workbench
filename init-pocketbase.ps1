$ErrorActionPreference = "Stop"

$workspace = "D:\Users\19586\Documents\video IP igent"
$pb = Join-Path $workspace "tools\pocketbase\pocketbase.exe"
$dataDir = Join-Path $workspace "tools\pocketbase\pb_data"
$migrationsDir = Join-Path $workspace "pb_migrations"
$localDir = Join-Path $workspace "local"
$credFile = Join-Path $localDir "pocketbase-superuser.json"

if (-not (Test-Path -LiteralPath $pb)) {
  throw "PocketBase executable not found. Run .\install-pocketbase.ps1 first."
}

New-Item -ItemType Directory -Force -Path $dataDir, $migrationsDir, $localDir | Out-Null

$listeners = Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
  Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
}

& $pb migrate up --dir $dataDir --migrationsDir $migrationsDir

if (Test-Path -LiteralPath $credFile) {
  $credential = Get-Content -LiteralPath $credFile -Raw | ConvertFrom-Json
} else {
  $bytes = New-Object byte[] 24
  $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  $password = [Convert]::ToBase64String($bytes).TrimEnd("=") + "Aa1!"
  $credential = [pscustomobject]@{
    email = "admin@personal-ip.local"
    password = $password
    createdAt = (Get-Date).ToString("s")
  }
  $credential | ConvertTo-Json | Set-Content -LiteralPath $credFile -Encoding UTF8
}

& $pb superuser upsert $credential.email $credential.password --dir $dataDir --migrationsDir $migrationsDir

Write-Host "PocketBase initialized."
Write-Host "Admin UI: http://127.0.0.1:8090/_/"
Write-Host "Superuser email: $($credential.email)"
Write-Host "Superuser credential file: $credFile"
