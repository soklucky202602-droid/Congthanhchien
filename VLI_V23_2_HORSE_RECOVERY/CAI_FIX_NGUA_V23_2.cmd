@echo off
setlocal
chcp 65001 >nul
set "script=%~dp0INSTALL_V23_2_NGUA.ps1"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%script%" -GameDir "%~1"
set "code=%errorlevel%"
if not "%code%"=="0" echo LOI. Chua cai hoan tat, hay xem thong bao o tren.
pause
exit /b %code%
