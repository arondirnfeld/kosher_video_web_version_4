@echo off
rem =================================================================
rem  Kosher Video Processor - Local Development Server
rem =================================================================
rem This script starts a simple Python-based web server to run the
rem application locally. FFmpeg.wasm and Web Workers require the app
rem to be served over HTTP, not opened as a local file (file://).

rem Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not found in your PATH.
    echo Please install Python (https://www.python.org/downloads/) and ensure it's added to your PATH.
    pause
    exit /b
)

echo =======================================

echo  Starting local web server...

echo  Open your browser and navigate to:

echo  http://localhost:8000

echo =======================================

echo (To stop the server, press CTRL+C in this window)


rem Start the server
python -m http.server
