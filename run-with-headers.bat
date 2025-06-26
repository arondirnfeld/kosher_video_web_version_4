@echo off
echo Starting Kosher Video Web Server with COOP/COEP headers...
echo.
echo This server will enable SharedArrayBuffer support in your browser.
echo.
echo Please access the application at: http://localhost:8080
echo Press Ctrl+C to stop the server when done.
echo.

node serve-with-headers.js

pause
