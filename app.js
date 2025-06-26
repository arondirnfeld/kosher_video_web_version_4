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
        // hideLoadingScreen() is now called when the worker is ready
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

    // ===== WORKER INITIALIZATION =====
    async initializeWorker() {
        this.worker = new Worker('./workers/video-processor.js');

        this.worker.onmessage = (event) => {
            const { type, payload } = event.data;

            switch (type) {
                case 'ffmpeg-loaded':
                    console.log('FFmpeg loaded in worker');
                    const loadingText = document.querySelector('.loading-text h2');
                    if (loadingText) {
                        loadingText.textContent = 'Ready to Transform!';
                    }
                    setTimeout(() => this.hideLoadingScreen(), 500);
                    break;
                case 'processing-progress':
                    this.updateProcessingProgress(payload.progress * 100);
                    if (payload.message) {
                        this.updateProcessingLog(payload.message);
                    }
                    break;
                case 'processing-complete':
                    this.isProcessing = false;
                    this.processedFileData = new Uint8Array(payload.data);
                    this.processedFileName = payload.fileName;
                    this.showResults();
                    break;
                case 'processing-error':
                    this.isProcessing = false;
                    this.showErrorModal(payload.error);
                    break;
                case 'ffmpeg-load-error':
                    this.showErrorModal('Failed to load the video processing engine. Please try refreshing the page.');
                    break;
            }
        };

        this.worker.onerror = (error) => {
            console.error('Worker error:', error);
            this.showErrorModal('A critical error occurred with the processing worker.');
        };

        this.worker.postMessage({ type: 'load-ffmpeg' });
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

    // ===== PROCESSING =====
    startSlideshowCreation() {
        if (!this.currentFile || this.isProcessing) return;

        this.isProcessing = true;
        this.currentOperation = 'slideshow';
        this.showProcessingScreen();

        const interval = this.elements.intervalSlider.value;
        const outputFilename = `slideshow_${this.currentFile.name.split('.').slice(0, -1).join('.')}.mp4`;

        this.worker.postMessage({
            type: 'run-command',
            payload: {
                file: this.currentFile,
                command: 'slideshow',
                args: {
                    interval,
                    outputFilename
                }
            }
        });
    }

    startAudioExtraction() {
        if (!this.currentFile || this.isProcessing) return;

        this.isProcessing = true;
        this.currentOperation = 'audio-extract';
        this.showProcessingScreen();

        const format = this.elements.audioFormat.value;
        const outputFilename = `audio_${this.currentFile.name.split('.').slice(0, -1).join('.')}.${format}`;

        this.worker.postMessage({
            type: 'run-command',
            payload: {
                file: this.currentFile,
                command: 'extract-audio',
                args: {
                    format,
                    outputFilename
                }
            }
        });
    }

    // ===== UI UPDATE FUNCTIONS =====
    showProcessingScreen() {
        this.elements.processingSection.classList.remove('hidden');
        this.elements.resultsSection.classList.add('hidden');
        
        // Reset and show initial processing state
        this.elements.processingStage.textContent = 'Initializing';
        this.elements.processingDetails.textContent = 'Preparing video processing...';
        this.elements.processingStatus.textContent = 'Starting';
        this.updateProcessingProgress(0);
        
        // Animate processing section entrance
        anime({
            targets: '.processing-container',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutCubic'
        });

        // Start the timer for tracking elapsed processing time
        this.startProcessingTimer();
        
        // Scroll to processing section
        this.elements.processingSection.scrollIntoView({ behavior: 'smooth' });
    }

    updateProcessingProgress(percent) {
        const p = Math.max(0, Math.min(100, percent));
        this.elements.processingProgress.style.width = `${p}%`;
        this.elements.processingPercent.textContent = `${Math.round(p)}%`;
    }

    updateProcessingLog(message) {
        if (message.includes('frame=')) {
            this.elements.processingStatus.textContent = `Processing... ${message.substring(message.indexOf('frame='))}`;
        } else if (message.includes('size=')) {
            this.elements.processingStatus.textContent = `Finalizing... ${message.substring(message.indexOf('size='))}`;
        }
    }

    // Start the timer for tracking elapsed processing time
    startProcessingTimer() {
        this.startTime = Date.now();
        this.updateElapsedTime();
    }
    
    // Update the elapsed time display
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

    showResults() {
        // Common success message
        const title = this.currentOperation === 'slideshow' ? 'Slideshow Created!' : 'Audio Extracted!';
        const description = this.currentOperation === 'slideshow' ? 
            'Your video has been converted to a slideshow with original audio.' : 
            `Your audio has been successfully extracted in ${this.elements.audioFormat.value.toUpperCase()} format.`;
        
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
        
        // Scroll to results section
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });

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
        if (!this.processedFileData) {
            this.showError('No processed file available for download.');
            return;
        }

        try {
            // Determine MIME type based on file extension
            let mimeType = 'application/octet-stream';
            if (this.processedFileName.endsWith('.mp4')) {
                mimeType = 'video/mp4';
            } else if (this.processedFileName.endsWith('.mp3')) {
                mimeType = 'audio/mpeg';
            } else if (this.processedFileName.endsWith('.wav')) {
                mimeType = 'audio/wav';
            } else if (this.processedFileName.endsWith('.ogg')) {
                mimeType = 'audio/ogg';
            }

            const blob = new Blob([this.processedFileData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.processedFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log('File download initiated:', this.processedFileName);
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

    // ===== LOADING SCREEN =====
    hideLoadingScreen() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.mainApp.classList.remove('hidden');
        
        // Fade in main app with animation
        anime({
            targets: this.elements.mainApp,
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeInOutQuad'
        });
        
        console.log('Loading screen hidden, main app displayed');
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
