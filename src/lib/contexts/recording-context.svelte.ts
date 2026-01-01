/**
 * Recording Context - Complete recording controller
 * Handles ALL recording logic including MediaRecorder, streams, intervals,
 * canvas compositing, webcam PIP, annotations, and timing
 * Uses Svelte's context API with $state runes for reactivity
 */

import { getContext, setContext } from 'svelte';

const RECORDING_CONTEXT_KEY = Symbol('recording-context');

export type RecordingQuality = 'low' | 'medium' | 'high';
export type WebcamPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type WebcamSize = 'small' | 'medium' | 'large';
export type WebcamShape = 'rectangle' | 'circle';

export interface RecordingSettings {
    selectedSource: 'screen' | 'window' | 'camera';
    includeWebcam: boolean;
    includeSystemAudio: boolean;
    includeMicAudio: boolean;
    webcamPosition: WebcamPosition;
    webcamSize: WebcamSize;
    webcamShape: WebcamShape;
    maxDuration: number;
    quality: RecordingQuality;
    countdownDuration: number;
}

const DEFAULT_SETTINGS: RecordingSettings = {
    selectedSource: 'screen',
    includeWebcam: false,
    includeSystemAudio: true,
    includeMicAudio: true,
    webcamPosition: 'bottom-right',
    webcamSize: 'medium',
    webcamShape: 'circle',
    maxDuration: 600,
    quality: 'high',
    countdownDuration: 3
};

export class RecordingContext {
    // ============= Recording State (reactive) =============
    isRecording = $state(false);
    isPaused = $state(false);
    recordingTime = $state(0);
    countdown = $state(0);

    // Video output state
    videoBlob = $state<Blob | null>(null);
    recordedVideoUrl = $state('');
    thumbnail = $state('');
    videoDuration = $state(0);
    showPreviewModal = $state(false);

    // Settings (reactive)
    settings = $state<RecordingSettings>({ ...DEFAULT_SETTINGS });

    // ============= Internal State =============
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private webcamStream: MediaStream | null = null;
    private canvasStream: MediaStream | null = null;
    private recordedChunks: Blob[] = [];
    private recordingInterval: number | null = null;
    private countdownInterval: number | null = null;
    private recordingStartTime: number = 0;
    private recordingEvents: { type: string; time: number; scrollTop: number }[] = [];

    // Canvas elements (set by component)
    private canvasRef: HTMLCanvasElement | null = null;
    private canvasCtx: CanvasRenderingContext2D | null = null;
    private videoPreviewRef: HTMLVideoElement | null = null;
    private webcamPreviewRef: HTMLVideoElement | null = null;
    private animationFrameId: number | null = null;

    // Annotation canvas
    private annotationCanvas: HTMLCanvasElement | null = null;
    private annotationCtx: CanvasRenderingContext2D | null = null;

    // Callbacks
    private onStartCallback?: () => void;
    private onEndCallback?: () => void;
    private onPauseCallback?: () => void;
    private onResumeCallback?: () => void;
    private onErrorCallback?: (error: Error) => void;
    private onVideoReadyCallback?: (blob: Blob, url: string) => void;

    // ============= Canvas Element Setters =============

    setCanvasRef(canvas: HTMLCanvasElement | null) {
        this.canvasRef = canvas;
        if (canvas) {
            this.canvasCtx = canvas.getContext('2d');
        }
    }

    setVideoPreviewRef(video: HTMLVideoElement | null) {
        this.videoPreviewRef = video;
    }

    setWebcamPreviewRef(video: HTMLVideoElement | null) {
        this.webcamPreviewRef = video;
    }

    getCanvasRef(): HTMLCanvasElement | null {
        return this.canvasRef;
    }

    // ============= Annotation Canvas =============

    initAnnotationCanvas() {
        if (!this.canvasRef) return;

        this.annotationCanvas = document.createElement('canvas');
        this.annotationCanvas.width = this.canvasRef.width;
        this.annotationCanvas.height = this.canvasRef.height;
        this.annotationCtx = this.annotationCanvas.getContext('2d');
    }

    getAnnotationContext(): CanvasRenderingContext2D | null {
        return this.annotationCtx;
    }

    getAnnotationCanvas(): HTMLCanvasElement | null {
        return this.annotationCanvas;
    }

    clearAnnotations() {
        if (this.annotationCtx && this.annotationCanvas) {
            this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
        }
    }

    // ============= Public API =============

    setCallbacks(callbacks: {
        onStart?: () => void;
        onEnd?: () => void;
        onPause?: () => void;
        onResume?: () => void;
        onError?: (error: Error) => void;
        onVideoReady?: (blob: Blob, url: string) => void;
    }) {
        this.onStartCallback = callbacks.onStart;
        this.onEndCallback = callbacks.onEnd;
        this.onPauseCallback = callbacks.onPause;
        this.onResumeCallback = callbacks.onResume;
        this.onErrorCallback = callbacks.onError;
        this.onVideoReadyCallback = callbacks.onVideoReady;
    }

    updateSettings(newSettings: Partial<RecordingSettings>) {
        this.settings = { ...this.settings, ...newSettings };
    }

    // ============= Canvas Compositing Loop =============

    private startCanvasLoop() {
        const drawFrame = () => {
            // Skip if not recording or missing required elements
            if (!this.canvasCtx || !this.videoPreviewRef || !this.isRecording) {
                if (this.isRecording) {
                    // Keep trying if we're recording but elements aren't ready
                    this.animationFrameId = requestAnimationFrame(drawFrame);
                }
                return;
            }

            // Draw video frame
            try {
                this.canvasCtx.drawImage(
                    this.videoPreviewRef,
                    0,
                    0,
                    this.canvasRef!.width,
                    this.canvasRef!.height
                );
            } catch (e) {
                // Video might not be ready yet
                this.animationFrameId = requestAnimationFrame(drawFrame);
                return;
            }

            // Draw webcam PIP if enabled
            if (this.settings.includeWebcam && this.webcamPreviewRef && this.webcamStream) {
                this.drawWebcamPIP();
            }

            // Draw annotation layer on top
            if (this.annotationCanvas && this.annotationCanvas.width > 0 && this.annotationCanvas.height > 0) {
                this.canvasCtx.drawImage(this.annotationCanvas, 0, 0);
            }

            this.animationFrameId = requestAnimationFrame(drawFrame);
        };

        this.animationFrameId = requestAnimationFrame(drawFrame);
    }

    private stopCanvasLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private drawWebcamPIP() {
        if (!this.canvasCtx || !this.webcamPreviewRef || !this.canvasRef) return;

        const pip = this.getWebcamPIPRect();

        this.canvasCtx.save();

        // Draw shadow/border
        this.canvasCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.canvasCtx.shadowBlur = 10;
        this.canvasCtx.fillStyle = '#000';

        if (this.settings.webcamShape === 'circle') {
            const radius = Math.min(pip.width, pip.height) / 2;
            const centerX = pip.x + pip.width / 2;
            const centerY = pip.y + pip.height / 2;

            this.canvasCtx.beginPath();
            this.canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.canvasCtx.clip();

            // Draw webcam within clipped circle
            const aspectRatio = this.webcamPreviewRef.videoWidth / this.webcamPreviewRef.videoHeight;
            let drawWidth = pip.width;
            let drawHeight = pip.height;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectRatio > pip.width / pip.height) {
                drawHeight = pip.width / aspectRatio;
                offsetY = (pip.height - drawHeight) / 2;
            } else {
                drawWidth = pip.height * aspectRatio;
                offsetX = (pip.width - drawWidth) / 2;
            }

            this.canvasCtx.drawImage(
                this.webcamPreviewRef,
                pip.x + offsetX,
                pip.y + offsetY,
                drawWidth,
                drawHeight
            );
        } else {
            // Rectangle
            this.canvasCtx.fillRect(pip.x - 2, pip.y - 2, pip.width + 4, pip.height + 4);
            this.canvasCtx.drawImage(this.webcamPreviewRef, pip.x, pip.y, pip.width, pip.height);
        }

        this.canvasCtx.restore();
    }

    getWebcamPIPRect(): { x: number; y: number; width: number; height: number } {
        if (!this.canvasRef) return { x: 0, y: 0, width: 0, height: 0 };

        const sizeMultipliers = { small: 0.15, medium: 0.2, large: 0.3 };
        const multiplier = sizeMultipliers[this.settings.webcamSize];
        const pipWidth = this.canvasRef.width * multiplier;
        const pipHeight = (pipWidth * 3) / 4;
        const padding = 20;

        let x = padding;
        let y = padding;

        switch (this.settings.webcamPosition) {
            case 'top-left':
                // Default values
                break;
            case 'top-right':
                x = this.canvasRef.width - pipWidth - padding;
                break;
            case 'bottom-left':
                y = this.canvasRef.height - pipHeight - padding;
                break;
            case 'bottom-right':
                x = this.canvasRef.width - pipWidth - padding;
                y = this.canvasRef.height - pipHeight - padding;
                break;
            case 'center':
                x = (this.canvasRef.width - pipWidth) / 2;
                y = (this.canvasRef.height - pipHeight) / 2;
                break;
        }

        return { x, y, width: pipWidth, height: pipHeight };
    }

    // ============= Recording Control =============

    async startRecording(): Promise<boolean> {
        if (this.isRecording) return false;

        try {
            // Get screen/window stream
            const displayMediaOptions: DisplayMediaStreamOptions = {
                video: {
                    displaySurface: this.settings.selectedSource === 'window' ? 'window' : 'monitor'
                } as any,
                audio: this.settings.includeSystemAudio
            };

            this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

            // Setup video preview
            if (this.videoPreviewRef && this.stream) {
                this.videoPreviewRef.srcObject = this.stream;
                await this.videoPreviewRef.play();
            }

            // Get webcam stream if enabled
            if (this.settings.includeWebcam) {
                try {
                    this.webcamStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 320, height: 240 },
                        audio: false
                    });
                    if (this.webcamPreviewRef && this.webcamStream) {
                        this.webcamPreviewRef.srcObject = this.webcamStream;
                        await this.webcamPreviewRef.play();
                    }
                } catch (e) {
                    console.warn('Could not get webcam stream:', e);
                }
            }

            // Setup canvas dimensions from video track
            if (this.canvasRef && this.stream) {
                const videoTrack = this.stream.getVideoTracks()[0];
                const trackSettings = videoTrack.getSettings();
                this.canvasRef.width = trackSettings.width || 1920;
                this.canvasRef.height = trackSettings.height || 1080;
            }

            // Initialize annotation canvas
            this.initAnnotationCanvas();

            // Start countdown
            if (this.settings.countdownDuration > 0) {
                await this.runCountdown();
            }

            // Start canvas compositing loop
            this.startCanvasLoop();

            // Create canvas stream for recording (includes all compositing)
            if (this.canvasRef) {
                this.canvasStream = this.canvasRef.captureStream(30);

                // Add audio track if available
                if (this.stream) {
                    const audioTracks = this.stream.getAudioTracks();
                    audioTracks.forEach(track => this.canvasStream!.addTrack(track));
                }
            }

            // Setup MediaRecorder with canvas stream
            const recordingStream = this.canvasStream || this.stream;
            if (!recordingStream) throw new Error('No stream available for recording');

            const options: MediaRecorderOptions = {
                mimeType: this.getSupportedMimeType(),
                videoBitsPerSecond: this.getVideoBitrate()
            };

            this.mediaRecorder = new MediaRecorder(recordingStream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                this.stopCanvasLoop();
                await this.processRecording();
            };

            // Start recording
            this.mediaRecorder.start(1000);
            this.isRecording = true;
            this.isPaused = false;
            this.recordingTime = 0;
            this.recordingStartTime = Date.now();
            this.recordingEvents = [];

            this.startTimer();
            this.onStartCallback?.();

            return true;
        } catch (error: any) {
            this.cleanup();
            this.onErrorCallback?.(error);
            return false;
        }
    }

    pauseRecording() {
        if (!this.isRecording || this.isPaused) return;

        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.stopTimer();
            this.onPauseCallback?.();
        }
    }

    resumeRecording() {
        if (!this.isRecording || !this.isPaused) return;

        if (this.mediaRecorder?.state === 'paused') {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.startTimer();
            this.onResumeCallback?.();
        }
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeRecording();
        } else {
            this.pauseRecording();
        }
    }

    stopRecording() {
        if (!this.isRecording) return;

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        this.isRecording = false;
        this.isPaused = false;
        this.stopTimer();
        this.stopCanvasLoop();
        this.onEndCallback?.();
    }

    cancelRecording() {
        this.stopRecording();
        this.cleanup();
        this.reset();
    }

    // ============= Webcam Controls =============

    cycleWebcamPosition() {
        const positions: WebcamPosition[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left', 'center'];
        const currentIndex = positions.indexOf(this.settings.webcamPosition);
        this.settings.webcamPosition = positions[(currentIndex + 1) % positions.length];
    }

    cycleWebcamSize() {
        const sizes: WebcamSize[] = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(this.settings.webcamSize);
        this.settings.webcamSize = sizes[(currentIndex + 1) % sizes.length];
    }

    toggleWebcamShape() {
        this.settings.webcamShape = this.settings.webcamShape === 'rectangle' ? 'circle' : 'rectangle';
    }

    setWebcamPosition(position: WebcamPosition) {
        this.settings.webcamPosition = position;
    }

    setWebcamSize(size: WebcamSize) {
        this.settings.webcamSize = size;
    }

    // ============= Recording Events =============

    addRecordingEvent(event: { type: string; scrollTop: number }) {
        if (this.isRecording) {
            this.recordingEvents.push({
                ...event,
                time: Date.now() - this.recordingStartTime
            });
        }
    }

    getRecordingEvents() {
        return [...this.recordingEvents];
    }

    // ============= State Getters =============

    getStream(): MediaStream | null {
        return this.stream;
    }

    getWebcamStream(): MediaStream | null {
        return this.webcamStream;
    }

    getMediaRecorderState(): RecordingState | null {
        return this.mediaRecorder?.state ?? null;
    }

    getRecordedChunks(): Blob[] {
        return [...this.recordedChunks];
    }

    // ============= Timer Logic =============

    private startTimer() {
        if (this.recordingInterval) return;

        this.recordingInterval = window.setInterval(() => {
            if (!this.isPaused) {
                this.recordingTime++;
                if (this.recordingTime >= this.settings.maxDuration) {
                    this.stopRecording();
                }
            }
        }, 1000);
    }

    private stopTimer() {
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
    }

    private async runCountdown(): Promise<void> {
        return new Promise((resolve) => {
            this.countdown = this.settings.countdownDuration;
            this.countdownInterval = window.setInterval(() => {
                this.countdown--;
                if (this.countdown <= 0) {
                    clearInterval(this.countdownInterval!);
                    this.countdownInterval = null;
                    resolve();
                }
            }, 1000);
        });
    }

    // ============= Video Processing =============

    private async processRecording() {
        if (this.recordedChunks.length === 0) return;

        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        this.videoBlob = blob;
        this.recordedVideoUrl = url;

        // Generate thumbnail
        try {
            this.thumbnail = await this.generateThumbnail(blob);
        } catch (e) {
            console.warn('Could not generate thumbnail:', e);
        }

        // Get duration
        try {
            this.videoDuration = await this.getVideoDuration(url);
        } catch (e) {
            console.warn('Could not get video duration:', e);
        }

        this.showPreviewModal = true;
        this.onVideoReadyCallback?.(blob, url);
    }

    private async generateThumbnail(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(blob);
            video.muted = true;

            video.addEventListener('loadeddata', () => {
                video.currentTime = Math.min(2, video.duration / 2);
            });

            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 360;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                URL.revokeObjectURL(video.src);
                resolve(dataUrl);
            });

            video.addEventListener('error', () => {
                URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video for thumbnail'));
            });
        });
    }

    private async getVideoDuration(url: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = url;
            video.onloadedmetadata = () => {
                resolve(video.duration);
            };
            video.onerror = () => reject(new Error('Failed to get duration'));
        });
    }

    private getSupportedMimeType(): string {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm';
    }

    private getVideoBitrate(): number {
        const bitrates: Record<RecordingQuality, number> = {
            low: 1000000, // 1 Mbps
            medium: 2500000, // 2.5 Mbps
            high: 5000000 // 5 Mbps
        };
        return bitrates[this.settings.quality];
    }

    // ============= Cleanup =============

    cleanup() {
        this.stopTimer();
        this.stopCanvasLoop();

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        this.stream?.getTracks().forEach((t) => t.stop());
        this.webcamStream?.getTracks().forEach((t) => t.stop());
        this.canvasStream?.getTracks().forEach((t) => t.stop());

        this.mediaRecorder = null;
        this.stream = null;
        this.webcamStream = null;
        this.canvasStream = null;
    }

    reset() {
        this.cleanup();
        this.isRecording = false;
        this.isPaused = false;
        this.recordingTime = 0;
        this.countdown = 0;
        this.videoBlob = null;
        this.recordedVideoUrl = '';
        this.thumbnail = '';
        this.videoDuration = 0;
        this.showPreviewModal = false;
        this.recordedChunks = [];
        this.recordingEvents = [];
        this.clearAnnotations();
    }

    // Check if we have an active recording session
    hasActiveSession(): boolean {
        return this.mediaRecorder !== null && this.mediaRecorder.state !== 'inactive';
    }

    // Format time helper
    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// ============= Context Functions =============

export function createRecordingContext(): RecordingContext {
    const context = new RecordingContext();
    setContext(RECORDING_CONTEXT_KEY, context);
    return context;
}

export function getRecordingContext(): RecordingContext | undefined {
    return getContext<RecordingContext>(RECORDING_CONTEXT_KEY);
}

export function hasRecordingContext(): boolean {
    try {
        return !!getContext<RecordingContext>(RECORDING_CONTEXT_KEY);
    } catch {
        return false;
    }
}
