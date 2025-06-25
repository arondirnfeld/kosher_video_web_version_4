#!/bin/bash

# Setup script for Kosher Video Processor
# This script downloads the necessary FFmpeg.wasm static assets for GitHub Pages deployment

echo "🎬 Setting up Kosher Video Processor for GitHub Pages..."

# Create static directory if it doesn't exist
mkdir -p static

# Download FFmpeg.wasm core files
echo "📥 Downloading FFmpeg.wasm assets..."

# FFmpeg Core JS
curl -L "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js" -o "static/ffmpeg-core.js"

# FFmpeg Core WASM
curl -L "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm" -o "static/ffmpeg-core.wasm"

# FFmpeg Core Worker
curl -L "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js" -o "static/ffmpeg-core.worker.js"

# FFmpeg Main Library
curl -L "https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/umd/ffmpeg.js" -o "static/ffmpeg.js"

# FFmpeg Util Library  
curl -L "https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js" -o "static/ffmpeg-util.js"

echo "✅ FFmpeg.wasm assets downloaded successfully!"

# Set proper permissions
chmod 644 static/*

echo "🚀 Setup complete! Your app is now ready for GitHub Pages deployment."
echo ""
echo "Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Enable GitHub Pages in your repository settings"
echo "3. Your app will be available at: https://username.github.io/repository-name"
