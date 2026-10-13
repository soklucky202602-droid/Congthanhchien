@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title VO LAM IDLE - TU DONG THU THAP TAI NGUYEN
set "PYTHON_EXEC="
py -3 --version >nul 2>nul
if not errorlevel 1 set "PYTHON_EXEC=py -3"
if not defined PYTHON_EXEC (
  python --version >nul 2>nul
  if not errorlevel 1 set "PYTHON_EXEC=python"
)
if not defined PYTHON_EXEC (
 echo KHONG TIM THAY PYTHON. Hay cai tu https://www.python.org/downloads/windows/
 echo Khi cai, tick "Add Python to PATH", sau do chay lai file nay.
 pause
 exit /b 1
)
echo.
echo Dang tai tu dong danh sach tai nguyen thieu. Co the mat thoi gian.
echo Vui long GIU CUA SO NAY MO. Co the dung bang Ctrl+C va chay lai de tai tiep.
echo.
%PYTHON_EXEC% "TU_DONG_TAI_TAI_NGUYEN.py" --workers 4 --rate 4
if errorlevel 1 (
 echo Co loi ket noi / qua trinh tai; kiem tra Internet roi chay lai.
) else (
 echo.
 echo DA KET THUC. File bao cao: BAO_CAO_TU_DONG.txt
 echo Neu muon gui lai ChatGPT: tai cac ZIP co ten VoLamIdle_TAI_BO_SUNG_PHAN_XX.zip
 echo Co the choi bang CHAY_GAME_OFFLINE.cmd ngay trong thu muc nay.
)
pause
