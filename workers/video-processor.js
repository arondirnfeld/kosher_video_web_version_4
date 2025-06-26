// Video Processing Worker
// Handles FFmpeg operations in a separate thread to keep UI responsive

let ffmpeg = null;
let isLoaded = false;

// Enhanced worker logging
const WorkerLogger = {
    log: function(component, message, data) {
        console.log(`[Worker][${component}] ${message}`, data || '');
        this._sendLogToMain('info', component, message, data);
    },
    debug: function(component, message, data) {
        console.debug(`[Worker][${component}] ${message}`, data || '');
        this._sendLogToMain('debug', component, message, data);
    },
    warn: function(component, message, data) {
        console.warn(`[Worker][${component}] ${message}`, data || '');
        this._sendLogToMain('warn', component, message, data);
    },
    error: function(component, message, error) {
        console.error(`[Worker][${component}] ${message}`, error || '');
        this._sendLogToMain('error', component, message, error);
    },
    // Send logs to main thread for unified logging
    _sendLogToMain: function(level, component, message, data) {
        try {
            self.postMessage({
                type: 'worker-log',
                payload: {
                    level,
                    component: `Worker:${component}`,
                    message,
                    data: data ? (typeof data === 'object' ? JSON.stringify(data) : data) : null,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (e) {
            // In case of circular references or other JSON errors
            console.error('Error sending log to main thread:', e);
        }
    }
};

WorkerLogger.log('Init', 'Video processor worker starting');

// Import FFmpeg in worker context - Using relative paths based on worker location
try {
    WorkerLogger.log('Init', 'Importing FFmpeg scripts');
    self.importScripts('../static/ffmpeg.js');
    self.importScripts('../static/ffmpeg-util.js');
    WorkerLogger.log('Init', 'FFmpeg scripts imported successfully');
} catch (error) {
    WorkerLogger.error('Init', 'Failed to import FFmpeg scripts', error);
    self.postMessage({ 
        type: 'ffmpeg-load-error', 
        payload: { 
            error: `Failed to import FFmpeg scripts: ${error.message}` 
        } 
    });
}

self.onmessage = async function(e) {
    const { type, payload } = e.data;
    WorkerLogger.log('Message', `Received message: ${type}`, payload);

    try {
        switch (type) {
            case 'load-ffmpeg':
                WorkerLogger.log('Message', 'Starting FFmpeg loading sequence');
                try {
                    // Check if SharedArrayBuffer is available in this context
                    if (typeof SharedArrayBuffer !== 'function') {
                        WorkerLogger.error('Message', 'SharedArrayBuffer not available in worker context');
                        throw new Error('SharedArrayBuffer is required but not available in this browser context');
                    }
                    
                    await initializeFFmpeg();
                    WorkerLogger.log('Message', 'FFmpeg loaded successfully, notifying main thread');
                    self.postMessage({ type: 'ffmpeg-loaded' });
                } catch (error) {
                    WorkerLogger.error('Message', 'FFmpeg initialization failed', error);
                    self.postMessage({ 
                        type: 'ffmpeg-load-error', 
                        payload: { 
                            error: `Failed to load FFmpeg: ${error.message}`,
                            stack: error.stack
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
    if (isLoaded) {
        WorkerLogger.log('FFmpeg', 'FFmpeg already loaded, skipping initialization');
        return;
    }

    WorkerLogger.log('FFmpeg', 'Starting FFmpeg initialization');

    // Check SharedArrayBuffer support
    WorkerLogger.log('FFmpeg', 'Checking SharedArrayBuffer support');
    let hasSharedArrayBuffer = false;
    try {
        if (typeof SharedArrayBuffer === 'function') {
            new SharedArrayBuffer(1);
            hasSharedArrayBuffer = true;
            WorkerLogger.log('FFmpeg', 'SharedArrayBuffer is supported in worker');
        } else {
            throw new Error('SharedArrayBuffer is not defined');
        }
    } catch (e) {
        WorkerLogger.error('FFmpeg', 'SharedArrayBuffer not supported in worker context', e);
        self.postMessage({ 
            type: 'ffmpeg-load-error', 
            payload: { 
                error: 'SharedArrayBuffer is required for video processing. ' + e.message
            } 
        });
        throw new Error('SharedArrayBuffer is required for video processing. Error: ' + e.message);
    }

    // Get FFmpeg constructor with detailed logging
    let FFmpegClass;
    try {
        WorkerLogger.debug('FFmpeg', 'Searching for FFmpeg in available scopes', {
            'self.FFmpeg exists': typeof self.FFmpeg !== 'undefined',
            'FFmpeg exists': typeof FFmpeg !== 'undefined',
            'self.createFFmpeg exists': typeof self.createFFmpeg !== 'undefined'
        });
        
        if (typeof self.FFmpeg !== 'undefined') {
            WorkerLogger.log('FFmpeg', 'FFmpeg found in global scope');
            FFmpegClass = self.FFmpeg.FFmpeg || self.FFmpeg;
            WorkerLogger.debug('FFmpeg', 'FFmpeg constructor from global scope', {
                isFunction: typeof FFmpegClass === 'function',
                constructor: FFmpegClass?.name || 'Unknown'
            });
        } else if (typeof FFmpeg !== 'undefined') {
            WorkerLogger.log('FFmpeg', 'FFmpeg found in local scope');
            FFmpegClass = FFmpeg.FFmpeg || FFmpeg;
            WorkerLogger.debug('FFmpeg', 'FFmpeg constructor from local scope', {
                isFunction: typeof FFmpegClass === 'function',
                constructor: FFmpegClass?.name || 'Unknown'
            });
        } else {
            WorkerLogger.error('FFmpeg', 'FFmpeg not found in any scope');
            throw new Error('FFmpeg not available in worker');
        }
        
        WorkerLogger.log('FFmpeg', 'FFmpeg constructor obtained successfully');
    } catch (error) {
        WorkerLogger.error('FFmpeg', 'Error getting FFmpeg constructor', error);
        self.postMessage({ 
            type: 'ffmpeg-load-error', 
            payload: { 
                error: `FFmpeg not available: ${error.message}` 
            } 
        });
        throw error;
    }

    try {
        WorkerLogger.log('FFmpeg', 'Creating FFmpeg instance');
        ffmpeg = new FFmpegClass();
        WorkerLogger.log('FFmpeg', 'FFmpeg instance created');

        // Set up event listeners
        ffmpeg.on('log', ({ message }) => {
            WorkerLogger.log('FFmpeg', `Log: ${message}`);
            self.postMessage({ 
                type: 'processing-progress', 
                payload: {
                    progress: 0,
                    message: message
                }
            });
        });

        ffmpeg.on('progress', ({ progress }) => {
            WorkerLogger.log('FFmpeg', `Progress: ${Math.round(progress * 100)}%`);
            self.postMessage({ 
                type: 'processing-progress', 
                payload: {
                    progress: progress,
                    message: `Processing: ${Math.round(progress * 100)}%`
                }
            });
        });

        // Load FFmpeg core with local static files
        const corePaths = {
            coreURL: '../static/ffmpeg-core.js',
            wasmURL: '../static/ffmpeg-core.wasm',
            workerURL: '../static/ffmpeg-core.worker.js'
        };
        
        WorkerLogger.log('FFmpeg', 'Loading FFmpeg core files', corePaths);
        
        // Verify file existence by logging
        WorkerLogger.debug('FFmpeg', 'Core file paths will be resolved relative to worker location', {
            workerLocation: self.location ? self.location.href : 'Unknown'
        });
        
        // Log before attempting to load
        WorkerLogger.log('FFmpeg', 'Starting FFmpeg load process');

        await ffmpeg.load({
            coreURL: corePaths.coreURL,
            wasmURL: corePaths.wasmURL,
            workerURL: corePaths.workerURL,
            // Add progress logging for the load operation
            progress: ({ ratio }) => {
                WorkerLogger.log('FFmpeg', `Loading progress: ${Math.round(ratio * 100)}%`);
            }
        });

        WorkerLogger.log('FFmpeg', 'FFmpeg core loaded successfully');
        isLoaded = true;
        
    } catch (error) {
        WorkerLogger.error('FFmpeg', 'Error loading FFmpeg', error);
        self.postMessage({ 
            type: 'ffmpeg-load-error', 
            payload: {
                error: `Failed to load FFmpeg: ${error.message || 'Unknown error'}`
            }
        });
        throw error;
    }
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
