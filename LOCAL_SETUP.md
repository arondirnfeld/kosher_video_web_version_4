# 🏠 Local Development Setup

Since you're running into issues with the `file://` protocol, here are the best ways to run the application locally:

## 🚀 Quick Solutions

### Option 1: Python HTTP Server (Recommended)
```bash
# Navigate to your project folder
cd "C:\Users\abamo\OneDrive\Documents\Coding Projects\KosherVideoWeb\kosher_video_web_version_4"

# Start a local server (Python 3)
python -m http.server 8000

# Or if you have Python 2
python -m SimpleHTTPServer 8000
```
Then open: http://localhost:8000

### Option 2: Node.js HTTP Server
```bash
# Install a simple server globally
npm install -g http-server

# Navigate to your project folder
cd "C:\Users\abamo\OneDrive\Documents\Coding Projects\KosherVideoWeb\kosher_video_web_version_4"

# Start server
http-server

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
