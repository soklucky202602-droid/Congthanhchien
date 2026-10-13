@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py -3 TAO_LAI_HTML_1_FILE.py & pause & exit /b)
python TAO_LAI_HTML_1_FILE.py
pause
