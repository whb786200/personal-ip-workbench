$ErrorActionPreference = "Stop"

$workspace = "D:\Users\19586\Documents\video IP igent"
$version = "0.39.4"
$tools = Join-Path $workspace "tools\pocketbase"
$zip = Join-Path $workspace "tools\pocketbase_$($version)_windows_amd64.zip"
$exe = Join-Path $tools "pocketbase.exe"

New-Item -ItemType Directory -Force -Path $tools | Out-Null

if (-not (Test-Path -LiteralPath $exe)) {
  $url = "https://sourceforge.net/projects/pocketbase.mirror/files/v$version/pocketbase_$($version)_windows_amd64.zip/download"
  curl.exe -L --retry 5 --connect-timeout 30 --max-time 300 -o $zip $url
  Expand-Archive -LiteralPath $zip -DestinationPath $tools -Force
}

& $exe --version
