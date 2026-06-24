$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $workspace

Write-Host "== 个人数字化 IP 工作台安装 =="

try {
  $nodeVersion = & node --version
  Write-Host "Node: $nodeVersion"
} catch {
  throw "未检测到 Node.js。请先安装 Node.js 24+。"
}

try {
  $gitVersion = & git --version
  Write-Host $gitVersion
} catch {
  Write-Warning "未检测到 Git。运行不受影响，但无法更新/推送仓库。"
}

if (-not (Test-Path -LiteralPath (Join-Path $workspace "tools\pocketbase\pocketbase.exe"))) {
  powershell -ExecutionPolicy Bypass -File (Join-Path $workspace "install-pocketbase.ps1")
}

powershell -ExecutionPolicy Bypass -File (Join-Path $workspace "init-pocketbase.ps1")

Write-Host "安装完成。运行 .\run-workbench.ps1 启动。"
