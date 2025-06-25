# Kosher Video Processor 🎥✨

A magical, fully static client-side web application for video processing that runs entirely in your browser with **zero server dependencies**. Perfect for GitHub Pages hosting!

## 🌟 Features

### 🎬 Video to Slideshow
- Convert any video into a slideshow with preserved audio
- Customizable frame extraction intervals (0.5 to 10 seconds)
- Maintains original audio quality and synchronization
- Perfect for creating presentations or highlights

### 🎵 Audio Extraction
- Extract pure audio from video files
- Multiple format support: **MP3**, **WAV**, **OGG**
- Lossless and compressed options available
- High-quality audio processing

### 🔮 Magic Features
- **100% Client-Side**: All processing happens in your browser
- **No Upload Required**: Files never leave your device
- **Offline Capable**: Works without internet after initial load
- **Memory Efficient**: Handles large files (500MB+) gracefully
- **Cross-Platform**: Works on desktop, tablet, and mobile

## 🚀 GitHub Pages Deployment

This app is specifically designed for GitHub Pages hosting. To deploy:

1. **Fork/Clone** this repository
2. **Enable GitHub Pages** in repository settings
3. **Include the `_headers` file** (critical for FFmpeg.wasm)
4. **Deploy** - Your app will be available at `https://yourusername.github.io/repo-name/`

**Important**: The `_headers` file configures CORS headers required for FFmpeg.wasm to work on GitHub Pages. Without it, video processing will fail.

See `DEPLOYMENT.md` for detailed step-by-step instructions.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Video Processing**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) v0.12.7
- **Animations**: [Anime.js](https://animejs.com/) v3.2.1
- **Icons**: [Font Awesome](https://fontawesome.com/) v6.0.0
- **Fonts**: [Orbitron](https://fonts.google.com/specimen/Orbitron) from Google Fonts
- **PWA**: Service Worker + Web App Manifest

## 🎨 Design Philosophy

- **Game-Like UI**: Magical, fluid animations and 3D-inspired visuals
- **Responsive Design**: Beautiful on all screen sizes
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance**: Smooth 60fps animations and efficient memory usage

## 📁 Project Structure

```
kosher_video_web_version_4/
├── index.html              # Main application HTML
├── styles.css              # Beautiful game-like styling
├── app.js                  # Core application logic
├── sw.js                   # Service Worker for PWA
├── manifest.json           # Web App Manifest
├── README.md              # This file
├── icons/                 # PWA icons (optional)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── screenshots/           # PWA screenshots (optional)
    ├── desktop-1.png
    └── mobile-1.png
```

## 🚀 Quick Start

### 1. Local Development

Simply open `index.html` in a modern web browser:

```bash
# Clone or download the project
cd kosher_video_web_version_4

# Option 1: Direct file open
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux

# Option 2: Local server (recommended)
python -m http.server 8000
# Or use any other local server
```

### 2. GitHub Pages Deployment

**Method A: Direct Upload**
1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click Save

**Method B: Git Commands**
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Kosher Video Processor v1.0"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/kosher-video-processor.git

# Push to GitHub
git branch -M main
git push -u origin main

# Enable GitHub Pages in repository settings
```

### 3. Custom Domain (Optional)

Create a `CNAME` file in the root directory:
```
your-domain.com
```

## 🔧 Configuration

### Browser Compatibility

**Minimum Requirements:**
- Chrome 67+ (2018)
- Firefox 61+ (2018)
- Safari 12+ (2018)
- Edge 79+ (2020)

**Required APIs:**
- WebAssembly
- File API
- Blob API
- URL.createObjectURL
- Web Workers (for FFmpeg.wasm)

### Performance Optimization

**Memory Management:**
- Files are processed in chunks
- Automatic cleanup after processing
- Memory usage warnings for large files

**Processing Limits:**
- Recommended max file size: 500MB
- Actual limit depends on device RAM
- Browser may show warnings for large files

## 🎯 Usage Guide

### Video to Slideshow
1. **Upload Video**: Drag & drop or click to select
2. **Set Interval**: Choose frame extraction interval (0.5-10 seconds)
3. **Process**: Click "Create Slideshow"
4. **Download**: Get your slideshow video with audio

### Audio Extraction
1. **Upload Video**: Same as above
2. **Choose Format**: Select MP3, WAV, or OGG
3. **Extract**: Click "Extract Audio"
4. **Download**: Get your audio file

### Supported Formats

**Input Video Formats:**
- MP4, AVI, MOV, MKV, WebM
- Most common codecs supported
- Maximum recommended size: 500MB

**Output Formats:**
- **Slideshow**: MP4 (H.264 + AAC)
- **Audio**: MP3, WAV, OGG

## 🐛 Troubleshooting

### Common Issues

**"Failed to load FFmpeg" Error:**
- Check internet connection (initial load only)
- Try refreshing the page
- Ensure browser supports WebAssembly

**Large File Processing:**
- Reduce video resolution before upload
- Use shorter video clips
- Close other browser tabs to free memory

**Slow Processing:**
- Normal for large files or slow devices
- Processing happens client-side (CPU intensive)
- Consider using a more powerful device

### Browser Console

Enable browser console (F12) to see detailed processing logs:
```javascript
// Check FFmpeg status
console.log(window.videoProcessor.ffmpeg);

// Monitor memory usage
console.log(performance.memory); // Chrome only
```

## 🔐 Privacy & Security

- **No Data Upload**: Files never leave your device
- **No Analytics**: No tracking or data collection
- **Local Processing**: Everything happens in your browser
- **No Cookies**: No persistent data storage
- **HTTPS Ready**: Secure by default on GitHub Pages

## 🤝 Contributing

Contributions welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Maintain zero server dependencies
- Test on multiple browsers and devices
- Follow existing code style and patterns
- Update documentation for new features
- Ensure accessibility compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Credits

- **FFmpeg.wasm**: Video processing engine
- **Anime.js**: Smooth animations
- **Font Awesome**: Beautiful icons
- **Google Fonts**: Orbitron typography
- **GitHub Pages**: Free static hosting

## 🔮 Future Enhancements

- [ ] Video trimming and cutting
- [ ] Multiple video merging
- [ ] Audio mixing and effects
- [ ] Batch processing
- [ ] Custom watermarks
- [ ] Video compression options
- [ ] Real-time preview
- [ ] Drag & drop reordering

## 📞 Support

Having issues? Here's how to get help:

1. **Check the troubleshooting section** above
2. **Open an issue** on GitHub with:
   - Browser and version
   - File type and size
   - Error messages
   - Steps to reproduce

---

**Made with 💜 for the video processing community**

*Transform your videos with client-side magic!* ✨🎬
