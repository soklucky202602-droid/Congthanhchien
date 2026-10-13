@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_8_PC_UI_CHAT_KY_TRAN_CAC.ps1" -Restore
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_V24_8_PC_UI_CHAT_KY_TRAN_CAC.ps1" -GameDir "%~1" -Restore
)
if errorlevel 1 (echo KHONG THE KHOI PHUC V24.8.) else (echo DA KHOI PHUC BAN UI TRUOC V24.8.)
pause
