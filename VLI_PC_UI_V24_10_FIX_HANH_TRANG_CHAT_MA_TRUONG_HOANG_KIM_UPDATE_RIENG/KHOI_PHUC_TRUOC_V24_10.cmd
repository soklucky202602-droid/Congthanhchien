@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_10_PC_UI.ps1" -Restore
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_10_PC_UI.ps1" -GameDir "%~1" -Restore
)
if errorlevel 1 (echo LOI: khong phuc hoi duoc V24.10.) else (echo OK: da phuc hoi giao dien truoc V24.10.)
pause
