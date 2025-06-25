# PWA Icons

This directory contains the Progressive Web App icons for different screen sizes.

## Required Icon Sizes

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

You can generate these icons from a single 512x512 source image using:

1. **Online Tools:**
   - [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
   - [Favicon Generator](https://favicon.io/favicon-generator/)
   - [Real Favicon Generator](https://realfavicongenerator.net/)

2. **Command Line Tools:**
   ```bash
   # Using ImageMagick
   convert source-512x512.png -resize 72x72 icon-72x72.png
   convert source-512x512.png -resize 96x96 icon-96x96.png
   # ... repeat for all sizes
   ```

3. **Design Tools:**
   - Photoshop
   - GIMP
   - Canva
   - Figma

## Icon Guidelines

- **Format:** PNG with transparency
- **Style:** Simple, recognizable at small sizes
- **Colors:** Match your app's theme (#8b5cf6 purple)
- **Content:** Video/magic related imagery
- **Background:** Transparent or solid color

## Current Status

The app will work without icons, but including them provides:
- Better mobile experience
- Professional app appearance
- Proper PWA installation
- Home screen shortcuts

Replace this README with actual icon files when ready!
