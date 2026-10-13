@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_9_PC_UI.ps1" -Restore
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_9_PC_UI.ps1" -GameDir "%~1" -Restore
)
if errorlevel 1 (echo LOI KHOI PHUC.) else (echo DA KHOI PHUC TRUOC V24.9.)
pause
