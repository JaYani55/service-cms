@echo off
setlocal

where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] npm is not installed or not in PATH.
    exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] git is not installed or not in PATH.
    exit /b 1
)

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

node scripts/cf-update.mjs %*
exit /b %errorlevel%