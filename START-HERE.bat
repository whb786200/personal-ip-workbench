@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\install.ps1"
powershell -ExecutionPolicy Bypass -File ".\run-workbench.ps1"
