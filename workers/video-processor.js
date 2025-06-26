// Video Processing Worker
// Handles FFmpeg operations in a separate thread to keep UI responsive

let ffmpeg = null;
let isLoaded = false;

// Import FFmpeg in worker context
self.importScripts('../static/ffmpeg.js');
self.importScripts('../static/ffmpeg-util.js');

self.onmessage = async function(e) {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'load-ffmpeg':
                await initializeFFmpeg();
                self.postMessage({ type: 'ffmpeg-loaded' });
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
            type: 'LOG', 
            message: message 
        });
    });

    ffmpeg.on('progress', ({ progress }) => {
        self.postMessage({ 
            type: 'PROGRESS', 
            progress: progress 
        });
    });

    // Load FFmpeg core with local static files
    await ffmpeg.load({
        coreURL: '../static/ffmpeg-core.js',
        wasmURL: '../static/ffmpeg-core.wasm',
        classWorkerURL: '../static/ffmpeg-core.worker.js'
    });

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

async function extractAudio(options) {
    const { inputFilename, format, outputFilename } = options;
    
    self.postMessage({ 
        type: 'STATUS_UPDATE', 
        stage: 'Extracting audio...',
        details: `Converting to ${format.toUpperCase()} format`
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

    // Read the output file
    const outputData = await ffmpeg.readFile(outputFilename);
    
    self.postMessage({ 
        type: 'AUDIO_COMPLETE', 
        outputData: outputData.buffer,
        filename: outputFilename
    });
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
    self.postMessage({ 
        type: 'ERROR', 
        error: `Unhandled error: ${event.reason}` 
    });
});
