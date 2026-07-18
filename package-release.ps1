$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath("Desktop")
$releaseName = "personal-ip-workbench"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$distRoot = Join-Path $workspace "dist"
$stage = Join-Path $distRoot $releaseName
$zipPath = Join-Path $desktop "$releaseName-$stamp.zip"
$desktopDir = Join-Path $desktop $releaseName

if (Test-Path -LiteralPath $stage) {
  Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$excludeDirs = @(".git", "dist", "local", "tools", "node_modules", "external")
$excludeFiles = @("*.log", "*.tmp", "*.zip")

Get-ChildItem -LiteralPath $workspace -Force | ForEach-Object {
  if ($excludeDirs -contains $_.Name) { return }
  foreach ($pattern in $excludeFiles) {
    if ($_.Name -like $pattern) { return }
  }
  Copy-Item -LiteralPath $_.FullName -Destination $stage -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}
Compress-Archive -LiteralPath (Join-Path $stage "*") -DestinationPath $zipPath -Force

if (Test-Path -LiteralPath $desktopDir) {
  Remove-Item -LiteralPath $desktopDir -Recurse -Force
}
Copy-Item -LiteralPath $stage -Destination $desktopDir -Recurse -Force

Write-Host "Package directory: $desktopDir"
Write-Host "Zip package: $zipPath"
