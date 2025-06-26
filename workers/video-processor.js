// Video Processing Worker
// Handles FFmpeg operations in a separate thread to keep UI responsive

let ffmpeg = null;
let isLoaded = false;

// Import FFmpeg in worker context - Using relative paths based on worker location
self.importScripts('../static/ffmpeg.js');
self.importScripts('../static/ffmpeg-util.js');

self.onmessage = async function(e) {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'load-ffmpeg':
                try {
                    await initializeFFmpeg();
                    self.postMessage({ type: 'ffmpeg-loaded' });
                } catch (error) {
                    console.error('FFmpeg initialization error:', error);
                    self.postMessage({ 
                        type: 'ffmpeg-load-error', 
                        payload: { 
                            error: `Failed to load FFmpeg: ${error.message}` 
                        } 
                    });
                }
                break;

            case 'run-command':
                if (payload.command === 'slideshow') {
                    await createSlideshow(payload);
                } else if (payload.command === 'extract-audio') {
                    await extractAudio(payload);
                } else {
                    throw new Error(`Unknown command: ${payload.command}`);
                }
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({ 
            type: 'ERROR', 
            error: error.message || 'Unknown error occurred'
        });
    }
};

async function initializeFFmpeg() {
    if (isLoaded) return;

    // Get FFmpeg constructor
    let FFmpegClass;
    if (typeof FFmpeg !== 'undefined') {
        FFmpegClass = FFmpeg.FFmpeg || FFmpeg;
    } else {
        throw new Error('FFmpeg not available in worker');
    }

    ffmpeg = new FFmpegClass();

    // Set up event listeners
    ffmpeg.on('log', ({ message }) => {
        self.postMessage({ 
            type: 'processing-progress', 
            payload: {
                progress: 0,
                message: message
            }
        });
    });

    ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ 
            type: 'processing-progress', 
            payload: {
                progress: progress,
                message: `Processing: ${Math.round(progress * 100)}%`
            }
        });
    });

    // Load FFmpeg core with local static files - Using relative paths based on worker location
    try {
        await ffmpeg.load({
            coreURL: '../static/ffmpeg-core.js',
            wasmURL: '../static/ffmpeg-core.wasm',
            workerURL: '../static/ffmpeg-core.worker.js'
        });
    } catch (error) {
        console.error('Error loading FFmpeg:', error);
        self.postMessage({ 
            type: 'processing-error', 
            payload: {
                error: `Failed to load FFmpeg: ${error.message}`
            }
        });
        throw error;
    }

    isLoaded = true;
}

async function loadFile(filename, fileData) {
    if (!ffmpeg || !isLoaded) {
        throw new Error('FFmpeg not initialized');
    }

    // Write file to FFmpeg's virtual file system
    await ffmpeg.writeFile(filename, new Uint8Array(fileData));
}

async function createSlideshow(payload) {
    const { file, args } = payload;
    const { interval, outputFilename } = args;
    const inputFilename = 'input.mp4';
    
    try {
        // Convert File to ArrayBuffer and then to Uint8Array
        const fileData = await file.arrayBuffer();
        const fileUint8 = new Uint8Array(fileData);

        // Write the file to FFmpeg's virtual filesystem
        await ffmpeg.writeFile(inputFilename, fileUint8);
        
        // Notify progress
        self.postMessage({ 
            type: 'processing-progress', 
            payload: {
                progress: 0.1,
                message: 'Extracting frames...'
            }
        });

        // Extract frames at specified interval
        await ffmpeg.exec([
            '-i', inputFilename,
            '-vf', `fps=1/${interval}`,
            '-y',
            'frame_%03d.png'
        ]);

        // Notify progress
        self.postMessage({ 
            type: 'processing-progress', 
            payload: {
                progress: 0.5,
                message: 'Creating slideshow with audio...'
            }
        });

        // Create slideshow with original audio
        await ffmpeg.exec([
            '-r', `1/${interval}`,
            '-i', 'frame_%03d.png',
            '-i', inputFilename,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-y',
            outputFilename
        ]);

        // Read the output file
        const outputData = await ffmpeg.readFile(outputFilename);
        
        // Send the complete response
        self.postMessage({ 
            type: 'processing-complete', 
            payload: {
                data: outputData.buffer,
                fileName: outputFilename
            }
        });

        // Clean up temporary files
        try {
            // Clean up frame files
            const files = await ffmpeg.listDir('.');
            for (const file of files) {
                if (file.name.startsWith('frame_') && file.name.endsWith('.png')) {
                    await ffmpeg.deleteFile(file.name);
                }
            }
            
            // Clean up input file
            await ffmpeg.deleteFile(inputFilename);
            await ffmpeg.deleteFile(outputFilename);
        } catch (e) {
            // Ignore cleanup errors
            console.warn('Cleanup error:', e);
        }
    } catch (error) {
        self.postMessage({
            type: 'processing-error',
            payload: {
                error: `Error creating slideshow: ${error.message}`
            }
        });
    }
}

async function extractAudio(payload) {
    const { file, args } = payload;
    const { format, outputFilename } = args;
    const inputFilename = 'input.mp4';
    
    try {
        // Convert File to ArrayBuffer and then to Uint8Array
        const fileData = await file.arrayBuffer();
        const fileUint8 = new Uint8Array(fileData);

        // Write the file to FFmpeg's virtual filesystem
        await ffmpeg.writeFile(inputFilename, fileUint8);
        
        // Notify progress
        self.postMessage({ 
            type: 'processing-progress', 
            payload: {
                progress: 0.2,
                message: `Extracting audio in ${format.toUpperCase()} format...`
            }
        });

        // Audio extraction command based on format
        let codecArgs = [];
        switch (format) {
            case 'mp3':
                codecArgs = ['-c:a', 'libmp3lame', '-b:a', '192k'];
                break;
            case 'wav':
                codecArgs = ['-c:a', 'pcm_s16le'];
                break;
            case 'ogg':
                codecArgs = ['-c:a', 'libvorbis', '-q:a', '5'];
                break;
            default:
                throw new Error(`Unsupported audio format: ${format}`);
        }

        await ffmpeg.exec([
            '-i', inputFilename,
            ...codecArgs,
            '-y',
            outputFilename
        ]);

        // Notify progress
        self.postMessage({ 
            type: 'processing-progress', 
            payload: {
                progress: 0.9,
                message: 'Finalizing audio extraction...'
            }
        });
        
        // Read the output file
        const outputData = await ffmpeg.readFile(outputFilename);
        
        // Send the complete response
        self.postMessage({ 
            type: 'processing-complete', 
            payload: {
                data: outputData.buffer,
                fileName: outputFilename
            }
        });
        
        // Clean up
        await ffmpeg.deleteFile(inputFilename);
        await ffmpeg.deleteFile(outputFilename);
        
    } catch (error) {
        self.postMessage({
            type: 'processing-error',
            payload: {
                error: `Error extracting audio: ${error.message}`
            }
        });
    }
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
    self.postMessage({ 
        type: 'ERROR', 
        error: `Unhandled error: ${event.reason}` 
    });
});
