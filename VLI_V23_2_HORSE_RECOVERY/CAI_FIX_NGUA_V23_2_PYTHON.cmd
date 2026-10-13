@echo off
setlocal
chcp 65001 >nul
where py >nul 2>nul
if not errorlevel 1 goto HAVE_PY
where python >nul 2>nul
if not errorlevel 1 goto HAVE_PYTHON
echo KHONG TIM THAY PYTHON. Hay chay CAI_FIX_NGUA_V23_2.cmd (PowerShell).
pause
exit /b 1
:HAVE_PY
py -3 "%~dp0REPAIR_V23_2.py" "%~1"
goto FINISH
:HAVE_PYTHON
python "%~dp0REPAIR_V23_2.py" "%~1"
:FINISH
set "code=%errorlevel%"
if not "%code%"=="0" echo CAI DAT LOI.
pause
exit /b %code%
