@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_10_PC_UI.ps1"
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_10_PC_UI.ps1" -GameDir "%~1"
)
if errorlevel 1 (
  echo.
  echo LOI: khong cai duoc V24.10. Hay gui thong bao loi.
) else (
  echo.
  echo OK: V24.10 da duoc cai. Mo game va nhan Ctrl+F5.
)
pause
