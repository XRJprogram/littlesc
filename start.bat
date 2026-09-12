@echo off
cd /d "%~dp0"
title littlesc - TurboWarp with AI Copilot
echo ========================================================
echo   littlesc (TurboWarp + AI Copilot) Launcher
echo ========================================================
echo.
echo [*] Checking Node.js environment...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [*] Starting services via Node.js launcher...
echo.

node scripts\start-all.mjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Process exited with error code %errorlevel%.
    pause
)
