@echo off
title JRKS Logistics ERP Launcher

:: 1. Always switch to project folder automatically
cd /d "%~dp0"

echo ====================================================
echo           JRKS LOGISTICS ERP LAUNCHER
echo ====================================================

:: 2. Check if MySQL server is running, if not start it
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL server is running on port 3306.
) else (
    echo [*] Starting MySQL server...
    start /B "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="C:\Users\ELCOT\mysql_data" --port=3306
    timeout /t 3 /nobreak >nul
)

:: 3. Open Browser automatically
start http://localhost:8080

:: 4. Start Frontend & Backend
echo [*] Starting Frontend and Backend servers...
echo [!] Web App available at: http://localhost:8080
echo ====================================================
call npm run dev
pause
