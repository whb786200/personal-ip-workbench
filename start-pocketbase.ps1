$ErrorActionPreference = "Stop"

$workspace = "D:\Users\19586\Documents\video IP igent"
$pb = Join-Path $workspace "tools\pocketbase\pocketbase.exe"
$pbData = Join-Path $workspace "tools\pocketbase\pb_data"
$pbMigrations = Join-Path $workspace "pb_migrations"

if (-not (Test-Path -LiteralPath $pb)) {
  throw "PocketBase executable not found. Run .\install-pocketbase.ps1 first."
}

New-Item -ItemType Directory -Force -Path $pbData, $pbMigrations | Out-Null

& $pb serve --http "127.0.0.1:8090" --dir $pbData --migrationsDir $pbMigrations
