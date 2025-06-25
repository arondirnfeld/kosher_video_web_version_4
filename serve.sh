#!/bin/bash
# =================================================================
#  Kosher Video Processor - Local Development Server
# =================================================================
# This script starts a simple Python-based web server to run the
# application locally. FFmpeg.wasm and Web Workers require the app
# to be served over HTTP, not opened as a local file (file://).

# Check for Python 3
if ! command -v python3 &> /dev/null
then
    echo "Python 3 is not found."
    echo "Please install Python 3 and ensure it's in your PATH."
    exit
fi

echo "======================================="
echo " Starting local web server..."
echo " Open your browser and navigate to:"
echo " http://localhost:8000"
echo "======================================="
echo "(To stop the server, press CTRL+C in this window)"

# Start the server
python3 -m http.server
