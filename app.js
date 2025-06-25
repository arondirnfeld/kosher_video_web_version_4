// ===== KOSHER VIDEO PROCESSOR - MAIN APPLICATION =====
// Static client-side video processing using FFmpeg.wasm

class KosherVideoProcessor {
    constructor() {
        this.worker = null;
        this.currentFile = null;
        this.isProcessing = false;
        this.startTime = null;
        this.processedFileData = null;
        this.processedFileName = null;
        this.currentOperation = null;
        
        // DOM elements
        this.elements = {};
        
        // Initialize the application
        this.init();
    }

    // ===== INITIALIZATION =====
    async init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupAnimations();
        
        // Update loading text
        const loadingText = document.querySelector('.loading-text h2');
        if (loadingText) {
            loadingText.textContent = 'Loading Video Engine...';
        }
        
        await this.initializeWorker();
        this.hideLoadingScreen();
    }

    cacheElements() {
        this.elements = {
            // Loading
            loadingScreen: document.getElementById('loading-screen'),
            loadingProgress: document.getElementById('loading-progress'),
            mainApp: document.getElementById('main-app'),
            
            // Upload
            uploadArea: document.getElementById('upload-area'),
            fileInput: document.getElementById('file-input'),
            fileInfo: document.getElementById('file-info'),
            fileName: document.getElementById('file-name'),
            fileSize: document.getElementById('file-size'),
            uploadProgress: document.getElementById('upload-progress'),
            progressText: document.getElementById('progress-text'),
            
            // Options
            optionsSection: document.getElementById('options-section'),
            intervalSlider: document.getElementById('interval-slider'),
            intervalValue: document.getElementById('interval-value'),
            audioFormat: document.getElementById('audio-format'),
            startSlideshow: document.getElementById('start-slideshow'),
            startAudioExtract: document.getElementById('start-audio-extract'),
            
            // Processing
            processingSection: document.getElementById('processing-section'),
            processingStage: document.getElementById('processing-stage'),
            processingDetails: document.getElementById('processing-details'),
            processingProgress: document.getElementById('processing-progress'),
            processingPercent: document.getElementById('processing-percent'),
            elapsedTime: document.getElementById('elapsed-time'),
            processingStatus: document.getElementById('processing-status'),
            
            // Results
            resultsSection: document.getElementById('results-section'),
            resultTitle: document.getElementById('result-title'),
            resultDescription: document.getElementById('result-description'),
            downloadResult: document.getElementById('download-result'),
            processAnother: document.getElementById('process-another'),
            
            // Error Modal
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            closeError: document.getElementById('close-error'),
            errorOk: document.getElementById('error-ok')
        };
    }

    setupEventListeners() {
        // Upload area events
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Slider events
        this.elements.intervalSlider.addEventListener('input', (e) => {
            this.elements.intervalValue.textContent = `${e.target.value}s`;
        });

        // Button events
        this.elements.startSlideshow.addEventListener('click', () => {
            this.startSlideshowCreation();
        });

        this.elements.startAudioExtract.addEventListener('click', () => {
            this.startAudioExtraction();
        });

        this.elements.processAnother.addEventListener('click', () => {
            this.resetApplication();
        });

        this.elements.downloadResult.addEventListener('click', () => {
            this.downloadProcessedFile();
        });

        // Error modal events
        this.elements.closeError.addEventListener('click', () => {
            this.hideErrorModal();
        });

        this.elements.errorOk.addEventListener('click', () => {
            this.hideErrorModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideErrorModal();
            }
        });
    }

    setupAnimations() {
        // Animate loading progress
        anime({
            targets: this.elements.loadingProgress,
            width: '100%',
            duration: 3000,
            easing: 'easeInOutQuad'
        });

        // Add hover animations to cards
        const cards = document.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                anime({
                    targets: card,
                    scale: 1.05,
                    duration: 300,
                    easing: 'easeOutCubic'
                });
            });

            card.addEventListener('mouseleave', () => {
                anime({
                    targets: card,
                    scale: 1,
                    duration: 300,
                    easing: 'easeOutCubic'
                });
            });
        });
    }

    // ===== FFMPEG LOADING =====
    async loadFFmpeg() {
        this.ffmpegLoadAttempts++;
        
        try {
            console.log(`Loading FFmpeg.wasm... (attempt ${this.ffmpegLoadAttempts})`);
            
            // Check for Cross-Origin Isolation support
            if (typeof SharedArrayBuffer === 'undefined') {
                console.warn('SharedArrayBuffer not available, trying fallback mode');
            }
            
            // Wait for FFmpeg to be available with longer timeout
            let retries = 0;
            const maxRetries = 150; // Increased to 15 seconds for GitHub Pages
            
            while (typeof FFmpeg === 'undefined' && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
                
                // Update loading text with progress
                if (retries % 15 === 0) {
                    const loadingText = document.querySelector('.loading-text h2');
                    if (loadingText) {
                        loadingText.textContent = `Loading Libraries... ${Math.round((retries / maxRetries) * 100)}%`;
                    }
                }
            }
            
            if (typeof FFmpeg === 'undefined') {
                throw new Error('FFmpeg library not loaded after waiting 15 seconds');
            }
            
            // Update loading text
            const loadingText = document.querySelector('.loading-text h2');
            if (loadingText) {
                loadingText.textContent = 'Initializing Video Engine...';
            }
            
            // Try different ways to access FFmpeg constructor
            let FFmpegClass;
            if (FFmpeg.FFmpeg) {
                FFmpegClass = FFmpeg.FFmpeg;
            } else if (typeof FFmpeg === 'function') {
                FFmpegClass = FFmpeg;
            } else {
                throw new Error('FFmpeg constructor not found');
            }
            
            this.ffmpeg = new FFmpegClass();
            
            // Set up progress logging
            this.ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg:', message);
                if (this.isProcessing) {
                    this.updateProcessingLog(message);
                }
            });

            this.ffmpeg.on('progress', ({ progress }) => {
                if (this.isProcessing) {
                    this.updateProcessingProgress(progress * 100);
                }
            });

            // Update loading text for core loading
            if (loadingText) {
                loadingText.textContent = 'Loading Core Engine...';
            }

            // Load FFmpeg with core and wasm files from CDN with fallback
            const loadConfig = {
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
                // GitHub Pages compatibility options
                classWorkerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js'
            };
            
            // Try loading with timeout for GitHub Pages
            const loadPromise = this.ffmpeg.load(loadConfig);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('FFmpeg load timeout after 30 seconds')), 30000)
            );
            
            await Promise.race([loadPromise, timeoutPromise]);

            console.log('FFmpeg.wasm loaded successfully!');
            this.ffmpegLoadAttempts = 0; // Reset on success
            
            // Update loading text
            if (loadingText) {
                loadingText.textContent = 'Ready to Transform!';
            }
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            
            if (this.ffmpegLoadAttempts < this.maxLoadAttempts) {
                console.log(`Retrying FFmpeg load in 3 seconds... (attempt ${this.ffmpegLoadAttempts + 1}/${this.maxLoadAttempts})`);
                
                // Update loading text to show retry
                const loadingText = document.querySelector('.loading-text h2');
                if (loadingText) {
                    loadingText.textContent = `Retrying... (${this.ffmpegLoadAttempts + 1}/${this.maxLoadAttempts})`;
                }
                
                setTimeout(() => {
                    this.loadFFmpeg();
                }, 3000);
                return;
            }
            
            // Show specific error after max attempts
            let errorMessage = 'Failed to load video processing engine.\n\n';
            
            if (error.message.includes('not loaded') || error.message.includes('not found')) {
                errorMessage += 'The video processing library could not be loaded. This may be due to:\n\n';
                errorMessage += '• Slow internet connection\n';
                errorMessage += '• Browser compatibility issues\n';
                errorMessage += '• Ad blockers blocking resources\n';
                
                // GitHub Pages specific guidance
                if (window.location.protocol === 'https:' && window.location.hostname.includes('github.io')) {
                    errorMessage += '• GitHub Pages CORS configuration\n\n';
                    errorMessage += 'For GitHub Pages, please try:\n';
                    errorMessage += '1. Refreshing the page\n';
                    errorMessage += '2. Waiting a moment for CDN resources to load\n';
                    errorMessage += '3. Using a different browser (Chrome/Firefox recommended)\n';
                    errorMessage += '4. Disabling ad blockers temporarily';
                } else if (window.location.protocol === 'file:') {
                    errorMessage += '• Local file restrictions (try using a web server)\n\n';
                    errorMessage += 'Please try:\n';
                    errorMessage += '1. Using a local web server (python -m http.server)\n';
                    errorMessage += '2. Refreshing the page\n';
                    errorMessage += '3. Disabling ad blockers\n';
                    errorMessage += '4. Using a different browser (Chrome/Firefox recommended)';
                } else {
                    errorMessage += '\nPlease try:\n';
                    errorMessage += '1. Refreshing the page\n';
                    errorMessage += '2. Disabling ad blockers\n';
                    errorMessage += '3. Using a different browser (Chrome/Firefox recommended)\n';
                    errorMessage += '4. Checking your internet connection';
                }
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage += 'Network connection issue detected.\n\n';
                errorMessage += 'Please check your internet connection and refresh the page.';
            } else {
                errorMessage += 'An unexpected error occurred.\n\n';
                errorMessage += 'Please refresh the page and try again.';
            }
            
            // Add manual retry button
            this.showErrorWithRetry(errorMessage);
        }
    }

    showErrorWithRetry(message) {
        this.elements.errorMessage.innerHTML = message.replace(/\n/g, '<br>');
        
        // Add retry button
        const retryButton = document.createElement('button');
        retryButton.className = 'btn btn-primary';
        retryButton.style.marginTop = '10px';
        retryButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
        retryButton.onclick = () => {
            this.hideErrorModal();
            this.ffmpegLoadAttempts = 0; // Reset attempts
            this.loadFFmpeg();
        };
        
        const modalFooter = this.elements.errorModal.querySelector('.modal-footer');
        modalFooter.insertBefore(retryButton, modalFooter.firstChild);
        
        this.elements.errorModal.classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutCubic'
        });
        
        console.log('Error with retry displayed:', message);
    }

    hideLoadingScreen() {
        // Only hide if FFmpeg loaded successfully
        if (this.ffmpeg) {
            setTimeout(() => {
                this.elements.loadingScreen.classList.add('hidden');
                this.elements.mainApp.classList.remove('hidden');
                this.elements.mainApp.style.opacity = '1';
                this.elements.mainApp.style.visibility = 'visible';
                
                // Animate main app entrance
                anime({
                    targets: '.section-content',
                    translateY: [50, 0],
                    opacity: [0, 1],
                    duration: 800,
                    delay: anime.stagger(200),
                    easing: 'easeOutCubic'
                });
            }, 1000); // Reduced timeout since we wait for actual FFmpeg loading
        }
    }

    // ===== FILE HANDLING =====
    handleFileSelect(file) {
        console.log('File selected:', file.name, file.size);
        
        // Validate file type
        if (!file.type.startsWith('video/')) {
            this.showError('Please select a valid video file.');
            return;
        }

        // Check file size (warn if > 500MB)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            if (!confirm(`This file is ${sizeMB}MB. Large files may take longer to process and consume more memory. Continue?`)) {
                return;
            }
        }

        this.currentFile = file;
        this.showFileInfo(file);
        this.showOptionsSection();
    }

    showFileInfo(file) {
        this.elements.fileName.textContent = file.name;
        this.elements.fileSize.textContent = this.formatFileSize(file.size);
        this.elements.fileInfo.classList.remove('hidden');
        
        // Simulate upload progress
        this.animateProgress(this.elements.uploadProgress, this.elements.progressText, 100, 1000);
    }

    showOptionsSection() {
        this.elements.optionsSection.classList.remove('hidden');
        
        // Animate options entrance
        anime({
            targets: '#options-section .option-card',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 600,
            delay: anime.stagger(200),
            easing: 'easeOutCubic'
        });
    }

    // ===== PROCESSING FUNCTIONS =====
    async startSlideshowCreation() {
        if (!this.currentFile || this.isProcessing) return;

        const interval = parseFloat(this.elements.intervalSlider.value);
        console.log(`Starting slideshow creation with ${interval}s interval`);

        this.showProcessingSection('Creating Slideshow', 'Extracting frames from your video...');
        
        try {
            this.isProcessing = true;
            this.startTime = Date.now();
            this.updateElapsedTime();

            // Read the input file
            await this.ffmpeg.writeFile('input.mp4', await this.fileToUint8Array(this.currentFile));
            
            this.updateProcessingStage('Analyzing Video', 'Getting video information...');
            
            // Extract frames at specified interval
            this.updateProcessingStage('Extracting Frames', `Taking screenshots every ${interval} seconds...`);
            await this.ffmpeg.exec([
                '-i', 'input.mp4',
                '-vf', `fps=1/${interval}`,
                '-y',
                'frame_%03d.png'
            ]);

            // Extract audio
            this.updateProcessingStage('Extracting Audio', 'Preserving original audio track...');
            await this.ffmpeg.exec([
                '-i', 'input.mp4',
                '-vn',
                '-acodec', 'copy',
                '-y',
                'audio.mp3'
            ]);

            // Create slideshow video
            this.updateProcessingStage('Creating Slideshow', 'Combining frames with audio...');
            await this.ffmpeg.exec([
                '-framerate', `1/${interval}`,
                '-i', 'frame_%03d.png',
                '-i', 'audio.mp3',
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-shortest',
                '-pix_fmt', 'yuv420p',
                '-y',
                'slideshow.mp4'
            ]);

            // Read output file
            const data = await this.ffmpeg.readFile('slideshow.mp4');
            this.processedFile = {
                data: data,
                filename: `slideshow_${this.currentFile.name.replace(/\.[^/.]+$/, '')}.mp4`,
                type: 'video/mp4'
            };

            this.showResults('Slideshow Created!', 'Your video has been converted to a slideshow with original audio.');
            
        } catch (error) {
            console.error('Slideshow creation failed:', error);
            this.showError('Failed to create slideshow. Please try again with a different file.');
        } finally {
            this.isProcessing = false;
            this.cleanup();
        }
    }

    async startAudioExtraction() {
        if (!this.currentFile || this.isProcessing) return;

        const format = this.elements.audioFormat.value;
        console.log(`Starting audio extraction to ${format} format`);

        this.showProcessingSection('Extracting Audio', 'Separating audio from your video...');
        
        try {
            this.isProcessing = true;
            this.startTime = Date.now();
            this.updateElapsedTime();

            // Read the input file
            await this.ffmpeg.writeFile('input.mp4', await this.fileToUint8Array(this.currentFile));
            
            this.updateProcessingStage('Analyzing Video', 'Reading video file...');
            
            // Extract audio based on format
            this.updateProcessingStage('Extracting Audio', `Converting to ${format.toUpperCase()} format...`);
            
            let codecArgs = [];
            let outputFile = '';
            
            switch (format) {
                case 'mp3':
                    codecArgs = ['-acodec', 'libmp3lame', '-ab', '192k'];
                    outputFile = 'audio.mp3';
                    break;
                case 'wav':
                    codecArgs = ['-acodec', 'pcm_s16le'];
                    outputFile = 'audio.wav';
                    break;
                case 'ogg':
                    codecArgs = ['-acodec', 'libvorbis', '-ab', '192k'];
                    outputFile = 'audio.ogg';
                    break;
            }

            await this.ffmpeg.exec([
                '-i', 'input.mp4',
                '-vn',
                ...codecArgs,
                '-y',
                outputFile
            ]);

            // Read output file
            const data = await this.ffmpeg.readFile(outputFile);
            this.processedFile = {
                data: data,
                filename: `audio_${this.currentFile.name.replace(/\.[^/.]+$/, '')}.${format}`,
                type: `audio/${format}`
            };

            this.showResults('Audio Extracted!', `Your audio has been successfully extracted in ${format.toUpperCase()} format.`);
            
        } catch (error) {
            console.error('Audio extraction failed:', error);
            this.showError('Failed to extract audio. Please try again with a different file.');
        } finally {
            this.isProcessing = false;
            this.cleanup();
        }
    }

    // ===== UI UPDATE FUNCTIONS =====
    showProcessingSection(title, details) {
        this.elements.processingStage.textContent = title;
        this.elements.processingDetails.textContent = details;
        this.elements.processingStatus.textContent = 'Processing';
        this.updateProcessingProgress(0);
        
        // Hide other sections
        this.elements.optionsSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.processingSection.classList.remove('hidden');
        
        // Animate processing section
        anime({
            targets: '.processing-container',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutCubic'
        });
    }

    updateProcessingStage(stage, details) {
        this.elements.processingStage.textContent = stage;
        this.elements.processingDetails.textContent = details;
        this.elements.processingStatus.textContent = 'Processing';
    }

    updateProcessingProgress(percent) {
        percent = Math.min(100, Math.max(0, percent));
        this.elements.processingProgress.style.width = `${percent}%`;
        this.elements.processingPercent.textContent = `${Math.round(percent)}%`;
    }

    updateProcessingLog(message) {
        // Extract progress from FFmpeg log messages
        const progressRegex = /time=(\d+):(\d+):(\d+\.\d+)/;
        const match = message.match(progressRegex);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const seconds = parseFloat(match[3]);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            
            // Estimate progress (this is rough, real implementation would need duration)
            const estimatedProgress = Math.min(90, (totalSeconds / 10) * 100);
            this.updateProcessingProgress(estimatedProgress);
        }
    }

    updateElapsedTime() {
        if (!this.isProcessing || !this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        this.elements.elapsedTime.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (this.isProcessing) {
            setTimeout(() => this.updateElapsedTime(), 1000);
        }
    }

    showResults(title, description) {
        this.elements.resultTitle.textContent = title;
        this.elements.resultDescription.textContent = description;
        
        // Hide processing section
        this.elements.processingSection.classList.add('hidden');
        this.elements.resultsSection.classList.remove('hidden');
        
        // Animate results
        anime({
            targets: '.results-container',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutCubic'
        });

        // Animate success icon
        anime({
            targets: '.preview-icon',
            scale: [0, 1],
            rotate: [0, 360],
            duration: 1000,
            delay: 300,
            easing: 'easeOutBack'
        });
    }

    // ===== UTILITY FUNCTIONS =====
    async fileToUint8Array(file) {
        return new Uint8Array(await file.arrayBuffer());
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    animateProgress(progressElement, textElement, targetPercent, duration) {
        anime({
            targets: { progress: 0 },
            progress: targetPercent,
            duration: duration,
            easing: 'easeInOutQuad',
            update: function(anim) {
                const progress = Math.round(anim.animations[0].currentValue);
                progressElement.style.width = `${progress}%`;
                if (textElement) {
                    textElement.textContent = `${progress}%`;
                }
            }
        });
    }

    downloadProcessedFile() {
        if (!this.processedFile) {
            this.showError('No processed file available for download.');
            return;
        }

        try {
            const blob = new Blob([this.processedFile.data], { type: this.processedFile.type });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.processedFile.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log('File download initiated:', this.processedFile.filename);
        } catch (error) {
            console.error('Download failed:', error);
            this.showError('Failed to download file. Please try again.');
        }
    }

    cleanup() {
        // Clean up FFmpeg files
        if (this.ffmpeg) {
            try {
                // List and remove all files
                const files = ['input.mp4', 'audio.mp3', 'audio.wav', 'audio.ogg', 'slideshow.mp4'];
                files.forEach(async (file) => {
                    try {
                        await this.ffmpeg.deleteFile(file);
                    } catch (e) {
                        // File might not exist, ignore
                    }
                });

                // Clean up frame files
                for (let i = 1; i <= 999; i++) {
                    try {
                        this.ffmpeg.deleteFile(`frame_${i.toString().padStart(3, '0')}.png`).catch(() => {
                            // No more frame files or error deleting
                        });
                    } catch (e) {
                        break; // No more frame files
                    }
                }
            } catch (error) {
                console.warn('Cleanup warning:', error);
            }
        }
    }

    resetApplication() {
        this.currentFile = null;
        this.processedFile = null;
        this.isProcessing = false;
        this.startTime = null;
        
        // Reset file input
        this.elements.fileInput.value = '';
        
        // Hide sections
        this.elements.fileInfo.classList.add('hidden');
        this.elements.optionsSection.classList.add('hidden');
        this.elements.processingSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        
        // Reset upload area
        this.elements.uploadArea.classList.remove('dragover');
        
        // Reset progress
        this.elements.uploadProgress.style.width = '0%';
        this.elements.progressText.textContent = '0%';
        
        console.log('Application reset');
    }

    // ===== ERROR HANDLING =====
    showError(message) {
        // Format message for better display
        const formattedMessage = message.replace(/\n/g, '<br>');
        this.elements.errorMessage.innerHTML = formattedMessage;
        this.elements.errorModal.classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutCubic'
        });
        
        console.log('Error displayed:', message);
    }

    hideErrorModal() {
        this.elements.errorModal.classList.add('hidden');
    }
}

// ===== APPLICATION STARTUP =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Kosher Video Processor - Starting...');
    
    // Check for required APIs
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        alert('Your browser does not support file handling. Please use a modern browser.');
        return;
    }

    // Check for WebAssembly support
    if (typeof WebAssembly !== 'object') {
        alert('Your browser does not support WebAssembly. Please use a modern browser.');
        return;
    }

    // Wait for all external libraries to load
    const checkLibraries = () => {
        const anime = typeof window.anime !== 'undefined';
        
        if (anime) {
            console.log('All libraries loaded, initializing application...');
            try {
                window.videoProcessor = new KosherVideoProcessor();
            } catch (error) {
                console.error('Failed to initialize application:', error);
                alert('Failed to initialize the application. Please refresh the page and try again.');
            }
        } else {
            console.log('Waiting for libraries to load...');
            setTimeout(checkLibraries, 200);
        }
    };
    
    // Start checking for libraries
    checkLibraries();
});

// ===== SERVICE WORKER FOR PWA (OPTIONAL) =====
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} else if (location.protocol === 'file:') {
    console.log('Service Worker disabled for local file:// protocol');
}
