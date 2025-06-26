# 🏠 Local Development Setup

The Kosher Video Processor requires special CORS headers for SharedArrayBuffer support. Here's how to set up the application locally:

## ⚠️ Important: Running with Required Headers

FFmpeg.wasm requires these headers to work properly:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

Regular file URLs (`file://`) and basic web servers won't set these headers. You need to use special methods for local development.

## 🚀 Recommended Solutions

### Option 1: Use the Built-in Server Script (Easiest)

We've included convenient scripts to run a server with the required headers:

**Windows:**
```bash
# Navigate to your project folder
cd path\to\kosher_video_web_version_4

# Run the included batch file
run-with-headers.bat
```

**Mac/Linux:**
```bash
# Navigate to your project folder
cd path/to/kosher_video_web_version_4

# Make the script executable (first time only)
chmod +x run-with-headers.sh

# Run the included shell script
./run-with-headers.sh
```

Then open: http://localhost:8080

### Option 2: Node.js with Custom Headers
```bash
# Navigate to your project folder
cd path\to\kosher_video_web_version_4

# Run the included Node.js server (with headers)
node serve-with-headers.js
```

Then open: http://localhost:8080

# Or with specific port
http-server -p 8000
```
Then open: http://localhost:8000

### Option 3: VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: PHP Built-in Server
```bash
# Navigate to your project folder
cd "C:\Users\abamo\OneDrive\Documents\Coding Projects\KosherVideoWeb\kosher_video_web_version_4"

# Start PHP server
php -S localhost:8000
```
Then open: http://localhost:8000

## 🔍 Why This is Needed

- **file:// protocol limitations**: Browsers restrict certain features when running from local files
- **CORS issues**: External resources (CDNs) may be blocked
- **Service Worker restrictions**: Can't register service workers from file:// protocol
- **WebAssembly loading**: FFmpeg.wasm works better over HTTP/HTTPS

## ✅ Benefits of Local Server

- ✅ All external libraries load properly
- ✅ Service Worker functionality works
- ✅ No CORS issues
- ✅ Better debugging and development experience
- ✅ Simulates real deployment environment

Choose any option above and the application should work perfectly! 🎉
