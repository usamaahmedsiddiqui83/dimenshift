@echo off
title DIMENSHIFT Website
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install the LTS version from https://nodejs.org and then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies - first run only, this can take a minute...
  call npm install
  if errorlevel 1 (
    echo Dependency install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo.
echo Starting the DIMENSHIFT website. Your browser will open automatically.
echo Keep this window open while you use the site. Close it to stop the website.
echo.
call npm run dev -- --open
pause