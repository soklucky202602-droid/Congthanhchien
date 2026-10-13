@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_8_PC_UI_CHAT_KY_TRAN_CAC.ps1"
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_8_PC_UI_CHAT_KY_TRAN_CAC.ps1" -GameDir "%~1"
)
if errorlevel 1 (
  echo.
  echo LOI CAI V24.8. Kiem tra thong bao phia tren.
) else (
  echo.
  echo DA CAI V24.8 - MO GAME VA NHAN CTRL+F5.
)
pause
