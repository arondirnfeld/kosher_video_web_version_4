@echo off
REM Setup script for Kosher Video Processor (Windows)
REM This script downloads the necessary FFmpeg.wasm static assets for GitHub Pages deployment

echo 🎬 Setting up Kosher Video Processor for GitHub Pages...

REM Create static directory if it doesn't exist
if not exist "static" mkdir static

REM Download FFmpeg.wasm core files
echo 📥 Downloading FFmpeg.wasm assets...

REM Use PowerShell to download files (Windows 10/11)
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js' -OutFile 'static/ffmpeg-core.js'"
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm' -OutFile 'static/ffmpeg-core.wasm'"
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js' -OutFile 'static/ffmpeg-core.worker.js'"
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/umd/ffmpeg.js' -OutFile 'static/ffmpeg.js'"
powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js' -OutFile 'static/ffmpeg-util.js'"

echo ✅ FFmpeg.wasm assets downloaded successfully!
echo.
echo 🚀 Setup complete! Your app is now ready for GitHub Pages deployment.
echo.
echo Next steps:
echo 1. Commit and push your changes to GitHub
echo 2. Enable GitHub Pages in your repository settings  
echo 3. Your app will be available at: https://username.github.io/repository-name
pause
