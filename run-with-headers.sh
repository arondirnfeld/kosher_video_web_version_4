#!/bin/bash

echo "Starting Kosher Video Web Server with COOP/COEP headers..."
echo ""
echo "This server will enable SharedArrayBuffer support in your browser."
echo ""
echo "Please access the application at: http://localhost:8080"
echo "Press Ctrl+C to stop the server when done."
echo ""

# Run the Node.js server with headers
node serve-with-headers.js

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Press any key to exit"
    read -n 1
    exit 1
fi

# Run the server
node serve-with-headers.js
