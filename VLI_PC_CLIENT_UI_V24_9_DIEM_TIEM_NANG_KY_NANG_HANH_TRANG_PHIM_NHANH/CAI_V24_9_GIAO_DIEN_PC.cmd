@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_9_PC_UI.ps1"
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_9_PC_UI.ps1" -GameDir "%~1"
)
if errorlevel 1 (
  echo.
  echo LOI: Khong the cai UI V24.9. Xem thong bao ben tren.
) else (
  echo.
  echo V24.9 da cai dat. Mo game lai va Ctrl+F5.
)
pause
