$ErrorActionPreference = "Stop"

$workspace = "D:\Users\19586\Documents\video IP igent"
$moneyPrinter = "D:\Users\19586\Documents\MoneyPrinterTurbo"
$uv = Join-Path $env:APPDATA "Python\Python313\Scripts\uv.exe"
$pocketBase = Join-Path $workspace "tools\pocketbase\pocketbase.exe"

function Test-Port {
  param([int]$Port)
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$connections
}

if (-not (Test-Path -LiteralPath (Join-Path $workspace "index.html"))) {
  throw "工作台入口不存在：$workspace\index.html"
}

if ((Test-Path -LiteralPath $moneyPrinter) -and (Test-Path -LiteralPath $uv)) {
  if (-not (Test-Port -Port 8501)) {
    $out = Join-Path $moneyPrinter "streamlit.out.log"
    $err = Join-Path $moneyPrinter "streamlit.err.log"
    $args = @(
      "run",
      "streamlit",
      "run",
      "./webui/Main.py",
      "--server.address",
      "127.0.0.1",
      "--server.port",
      "8501",
      "--server.headless",
      "true"
    )
    Start-Process -FilePath $uv -ArgumentList $args -WorkingDirectory $moneyPrinter -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err
  }
}

if (-not (Test-Port -Port 8787)) {
  $serverOut = Join-Path $workspace "workbench-server.out.log"
  $serverErr = Join-Path $workspace "workbench-server.err.log"
  Start-Process -FilePath "node" -ArgumentList @("server.js") -WorkingDirectory $workspace -WindowStyle Hidden -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr
  Start-Sleep -Seconds 2
}

if ((Test-Path -LiteralPath $pocketBase) -and -not (Test-Port -Port 8090)) {
  $pbOut = Join-Path $workspace "pocketbase.out.log"
  $pbErr = Join-Path $workspace "pocketbase.err.log"
  $pbLauncher = Join-Path $workspace "start-pocketbase.ps1"
  $pbCommand = "& '$pbLauncher'"
  Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $pbCommand) -WorkingDirectory $workspace -WindowStyle Hidden -RedirectStandardOutput $pbOut -RedirectStandardError $pbErr
  Start-Sleep -Seconds 2
}

Start-Process "http://127.0.0.1:8787"
Start-Process "http://127.0.0.1:8787/admin-cn.html"
Start-Process "http://127.0.0.1:8501"
# PocketBase native admin is English. Use http://127.0.0.1:8787/admin-cn.html for daily operation.
