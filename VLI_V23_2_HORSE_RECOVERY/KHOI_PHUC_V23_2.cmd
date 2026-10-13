@echo off
setlocal
chcp 65001 >nul
set "script=%~dp0INSTALL_V23_2_NGUA.ps1"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%script%" -GameDir "%~1" -Rollback
set "code=%errorlevel%"
pause
exit /b %code%
