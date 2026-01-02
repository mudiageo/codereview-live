/**
 * Recording Context - Complete recording controller
 * Handles ALL recording logic including MediaRecorder, streams, intervals,
 * canvas compositing, webcam PIP, annotations, and timing
 * Uses Svelte's context API with $state runes for reactivity
 */

import { getContext, setContext } from 'svelte';
import { snapdom } from '@zumer/snapdom';

// Constants
const CAPTURE_FPS = 10; // Reduced from 30 - DOM capture is expensive, 10fps is sufficient for screen recording
const MIN_CANVAS_WIDTH = 1280;
const MIN_CANVAS_HEIGHT = 720;
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
// Memory management constants
const CHUNK_CONSOLIDATION_THRESHOLD = 100; // Consolidate when chunks exceed this number
const RECENT_CHUNKS_TO_KEEP = 20; // Keep recent chunks separate for faster access

function createContext<T>(key: string) {
	return [() => getContext<T>(key), (value: T) => setContext(key, value)] as const;
}

// Type-safe context using local helper
const [getRecordingContextInternal, setRecordingContextInternal] =
	createContext<RecordingContext>('recording-context');

export type RecordingQuality = 'low' | 'medium' | 'high';
export type WebcamPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type WebcamSize = 'small' | 'medium' | 'large';
export type WebcamShape = 'rectangle' | 'circle';

export interface AnnotationTool {
	type: 'pen' | 'arrow' | 'rect' | 'circle';
	color: string;
	strokeWidth: number;
}

export interface RecordingSettings {
	selectedSource: 'workspace' | 'screen' | 'window' | 'camera';
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
	selectedSource: 'workspace',
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

	// Annotation UI State (reactive)
	currentTool = $state<AnnotationTool>({ type: 'pen', color: '#ff0000', strokeWidth: 3 });
	isDrawing = $state(false);
	isAnnotationMode = $state(false);
	annotationHistory = $state<ImageData[]>([]);
	historyIndex = $state(-1);

	// ============= Internal State =============
	private mediaRecorder: MediaRecorder | null = null;
	private stream: MediaStream | null = null;
	private webcamStream: MediaStream | null = null;
	private canvasStream: MediaStream | null = null;
	private recordedChunks: Blob[] = [];
	private recordingInterval: number | null = null;
	private countdownInterval: number | null = null;
	private recordingStartTime: number = 0;
	private recordingEvents: { type: string; time: number; data: any }[] = [];
	private workspaceElement: HTMLElement | null = null; // DOM element to capture
	private domCaptureInterval: number | null = null; // Interval for DOM capture
	private isCapturing: boolean = false; // Prevent concurrent captures

	// Canvas elements (internal master + external references)
	private masterCanvas: HTMLCanvasElement | null = null;
	private masterCtx: CanvasRenderingContext2D | null = null;
	private canvasRef: HTMLCanvasElement | null = null; // UI canvas
	private uiCtx: CanvasRenderingContext2D | null = null;
	private videoPreviewRef: HTMLVideoElement | null = null;
	private webcamPreviewRef: HTMLVideoElement | null = null;
	private animationFrameId: number | null = null;
	private uiUpdateFrameId: number | null = null; // Separate RAF for UI updates

	// Annotation canvas
	private annotationCanvas: HTMLCanvasElement | null = null;
	private annotationCtx: CanvasRenderingContext2D | null = null;

	// Webcam PIP caching
	private cachedPIPRect: { x: number; y: number; width: number; height: number } | null = null;
	private lastPIPSettings: string = '';

	// Memory management
	private memoryCleanupInterval: number | null = null;

	// Callbacks
	private onStartCallback?: () => void;
	private onEndCallback?: () => void;
	private onPauseCallback?: () => void;
	private onResumeCallback?: () => void;
	private onErrorCallback?: (error: Error) => void;
	private onVideoReadyCallback?: (blob: Blob, url: string) => void;

	// ============= Canvas Element Setters =============

	private initMasterCanvas(width: number, height: number) {
		if (
			this.masterCanvas &&
			this.masterCanvas.width === width &&
			this.masterCanvas.height === height
		) {
			return; // Already initialized
		}

		// Create disconnected canvas for processing
		this.masterCanvas = document.createElement('canvas');
		this.masterCanvas.width = width;
		this.masterCanvas.height = height;
		this.masterCtx = this.masterCanvas.getContext('2d', {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false
		});

		// Re-init annotation canvas to match
		this.initAnnotationCanvas(width, height);
	}

	// ============= Internal Video Elements (Persistent Source) =============
	private screenVideo: HTMLVideoElement | null = null;
	private webcamVideo: HTMLVideoElement | null = null;

	private async setupInternalVideo(stream: MediaStream, type: 'screen' | 'webcam') {
		const v = document.createElement('video');
		v.srcObject = stream;
		v.muted = true;
		v.playsInline = true;
		v.autoplay = true;
		await v.play();

		if (type === 'screen') {
			this.screenVideo = v;
		} else {
			this.webcamVideo = v;
		}
	}

	setCanvasRef(canvas: HTMLCanvasElement | null) {
		this.canvasRef = canvas;
		if (canvas) {
			this.uiCtx = canvas.getContext('2d');
		} else {
			this.uiCtx = null;
		}
	}

	setVideoPreviewRef(video: HTMLVideoElement | null) {
		this.videoPreviewRef = video;
		if (video && this.stream) {
			video.srcObject = this.stream;
			video.play().catch(console.error);
		}
	}

	setWebcamPreviewRef(video: HTMLVideoElement | null) {
		this.webcamPreviewRef = video;
		if (video && this.webcamStream) {
			video.srcObject = this.webcamStream;
			video.play().catch(console.error);
		}
	}

	setWorkspaceElement(element: HTMLElement | null) {
		this.workspaceElement = element;
	}

	getCanvasRef(): HTMLCanvasElement | null {
		return this.canvasRef; // Return UI canvas for mouse events
	}

	// ============= Annotation Canvas =============

	initAnnotationCanvas(width?: number, height?: number) {
		// Use provided dimensions or fallback to master canvas
		// If neither exists, we can't init yet
		if (!width && !height && !this.masterCanvas) return;

		const w = width || this.masterCanvas!.width;
		const h = height || this.masterCanvas!.height;

		this.annotationCanvas = document.createElement('canvas');
		this.annotationCanvas.width = w;
		this.annotationCanvas.height = h;
		this.annotationCtx = this.annotationCanvas.getContext('2d', {
			willReadFrequently: true // Optimizes for getImageData calls in undo/redo
		});
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
			this.annotationHistory = [];
			this.historyIndex = -1;
		}
	}

	// ============= Annotation History & Tools =============

	addToHistory() {
		if (this.annotationCtx && this.annotationCanvas) {
			const imageData = this.annotationCtx.getImageData(
				0,
				0,
				this.annotationCanvas.width,
				this.annotationCanvas.height
			);
			this.annotationHistory = [
				...this.annotationHistory.slice(0, this.historyIndex + 1),
				imageData
			];
			this.historyIndex = this.annotationHistory.length - 1;
		}
	}

	undoAnnotation() {
		if (this.historyIndex > 0 && this.annotationCtx && this.annotationCanvas) {
			this.historyIndex--;
			this.annotationCtx.putImageData(this.annotationHistory[this.historyIndex], 0, 0);
		} else if (this.historyIndex === 0 && this.annotationCtx && this.annotationCanvas) {
			this.historyIndex = -1;
			this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
		}
	}

	redoAnnotation() {
		if (this.historyIndex < this.annotationHistory.length - 1 && this.annotationCtx) {
			this.historyIndex++;
			this.annotationCtx.putImageData(this.annotationHistory[this.historyIndex], 0, 0);
		}
	}

	setTool(tool: AnnotationTool) {
		this.currentTool = tool;
	}

	// ============= Input Event Handlers =============

	handleKeyDown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		const key = e.key.toLowerCase();

		if (key === 'r' && !this.isRecording && this.countdown === 0) {
			e.preventDefault();
			this.startRecording();
		} else if (key === 's' && this.isRecording) {
			e.preventDefault();
			this.stopRecording();
		} else if ((key === ' ' || key === 'p') && this.isRecording) {
			e.preventDefault();
			this.togglePause();
		} else if (key === 'escape' && (this.isRecording || this.countdown > 0)) {
			e.preventDefault();
			this.cancelRecording();
		}

		// Webcam controls during recording
		if (this.isRecording && this.settings.includeWebcam) {
			if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
				e.preventDefault();
				this.cycleWebcamPosition();
				// toast.info(`Webcam: ${this.settings.webcamPosition}`); // To act on toast, we might need a callback or direct import
			} else if (key === '+' || key === '=') {
				e.preventDefault();
				this.cycleWebcamSize();
				// toast.info(`Webcam size: ${this.settings.webcamSize}`);
			} else if (key === 'c') {
				e.preventDefault();
				this.toggleWebcamShape();
				// toast.info(`Webcam shape: ${this.settings.webcamShape}`);
			}
		}
	}

	getMousePos(e: MouseEvent, canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	handleMouseDown(e: MouseEvent) {
		if (!this.annotationCtx || !this.isRecording || !this.canvasRef) return;

		this.isDrawing = true;
		const pos = this.getMousePos(e, this.canvasRef);

		this.annotationCtx.beginPath();
		this.annotationCtx.moveTo(pos.x, pos.y);
		this.annotationCtx.strokeStyle = this.currentTool.color;
		this.annotationCtx.lineWidth = this.currentTool.strokeWidth;
		this.annotationCtx.lineCap = 'round';
		this.annotationCtx.lineJoin = 'round';
	}

	handleMouseMove(e: MouseEvent) {
		if (!this.isDrawing || !this.annotationCtx || !this.canvasRef) return;

		const pos = this.getMousePos(e, this.canvasRef);
		this.annotationCtx.lineTo(pos.x, pos.y);
		this.annotationCtx.stroke();
	}

	handleMouseUp() {
		if (this.isDrawing && this.annotationCanvas && this.annotationCtx) {
			this.isDrawing = false;
			this.addToHistory();
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

	private startUIUpdateLoop() {
		// Use requestAnimationFrame for smooth 60fps UI updates
		// This is decoupled from the capture loop which runs at 10fps
		const updateUI = () => {
			if (!this.isRecording) {
				this.uiUpdateFrameId = null;
				return;
			}

			this.syncToUICanvas();
			this.uiUpdateFrameId = requestAnimationFrame(updateUI);
		};

		this.uiUpdateFrameId = requestAnimationFrame(updateUI);
	}

	private stopUIUpdateLoop() {
		if (this.uiUpdateFrameId) {
			cancelAnimationFrame(this.uiUpdateFrameId);
			this.uiUpdateFrameId = null;
		}
	}

	private syncToUICanvas() {
		if (this.uiCtx && this.canvasRef && this.masterCanvas) {
			try {
				// Resize UI canvas if needed to match master
				if (
					this.canvasRef.width !== this.masterCanvas.width ||
					this.canvasRef.height !== this.masterCanvas.height
				) {
					this.canvasRef.width = this.masterCanvas.width;
					this.canvasRef.height = this.masterCanvas.height;
				}

				this.uiCtx.drawImage(this.masterCanvas, 0, 0);
			} catch (e) {
				console.warn('Failed to draw to UI canvas', e);
			}
		}
	}

	private startCanvasLoop() {
		const drawFrame = () => {
			// Ensure master canvas exists and we have source material
			// We now rely on internal screenVideo, not videoPreviewRef
			if (!this.masterCtx || !this.screenVideo || !this.isRecording) {
				if (this.isRecording) {
					// Keep trying if we're recording but elements aren't ready
					this.animationFrameId = requestAnimationFrame(drawFrame);
				}
				return;
			}

			// 1. Draw video frame to MASTER canvas
			try {
				this.masterCtx.drawImage(
					this.screenVideo,
					0,
					0,
					this.masterCanvas!.width,
					this.masterCanvas!.height
				);
			} catch (e) {
				// Video might not be ready yet
				this.animationFrameId = requestAnimationFrame(drawFrame);
				return;
			}

			// 2. Draw webcam PIP to MASTER canvas
			if (this.settings.includeWebcam && this.webcamVideo && this.webcamStream) {
				this.drawWebcamPIP(this.masterCtx, this.masterCanvas!);
			}

			// 3. Draw annotation layer to MASTER canvas
			if (
				this.annotationCanvas &&
				this.annotationCanvas.width > 0 &&
				this.annotationCanvas.height > 0
			) {
				this.masterCtx.drawImage(this.annotationCanvas, 0, 0);
			}

			// 4. UI updates are handled by separate RAF loop for consistency
			// No need to call syncToUICanvas() here

			// Loop
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

	private drawWebcamPIP(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		if (!ctx || !this.webcamVideo) return;

		// Check if webcam video is ready
		if (
			this.webcamVideo.readyState < 2 ||
			this.webcamVideo.videoWidth === 0 ||
			this.webcamVideo.videoHeight === 0
		) {
			return;
		}

		const pip = this.getWebcamPIPRect(canvas);

		ctx.save();

		// Draw shadow/border
		ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
		ctx.shadowBlur = 10;
		ctx.fillStyle = '#000';

		if (this.settings.webcamShape === 'circle') {
			const radius = Math.min(pip.width, pip.height) / 2;
			const centerX = pip.x + pip.width / 2;
			const centerY = pip.y + pip.height / 2;

			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			ctx.clip();

			// Draw webcam within clipped circle
			const aspectRatio = this.webcamVideo.videoWidth / this.webcamVideo.videoHeight;
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

			ctx.drawImage(this.webcamVideo, pip.x + offsetX, pip.y + offsetY, drawWidth, drawHeight);
		} else {
			// Rectangle
			ctx.fillRect(pip.x - 2, pip.y - 2, pip.width + 4, pip.height + 4);
			ctx.drawImage(this.webcamVideo, pip.x, pip.y, pip.width, pip.height);
		}

		ctx.restore();
	}

	getWebcamPIPRect(canvas: HTMLCanvasElement): {
		x: number;
		y: number;
		width: number;
		height: number;
	} {
		if (!canvas) return { x: 0, y: 0, width: 0, height: 0 };

		// Create a settings key for caching
		const settingsKey = `${canvas.width}x${canvas.height}-${this.settings.webcamPosition}-${this.settings.webcamSize}`;

		// Return cached rect if settings haven't changed
		if (this.cachedPIPRect && this.lastPIPSettings === settingsKey) {
			return this.cachedPIPRect;
		}

		const sizeMultipliers = { small: 0.15, medium: 0.2, large: 0.3 };
		const multiplier = sizeMultipliers[this.settings.webcamSize];
		const pipWidth = canvas.width * multiplier;
		const pipHeight = (pipWidth * 3) / 4;
		const padding = 20;

		let x = padding;
		let y = padding;

		switch (this.settings.webcamPosition) {
			case 'top-left':
				// Default values
				break;
			case 'top-right':
				x = canvas.width - pipWidth - padding;
				break;
			case 'bottom-left':
				y = canvas.height - pipHeight - padding;
				break;
			case 'bottom-right':
				x = canvas.width - pipWidth - padding;
				y = canvas.height - pipHeight - padding;
				break;
			case 'center':
				x = (canvas.width - pipWidth) / 2;
				y = (canvas.height - pipHeight) / 2;
				break;
		}

		// Cache the result
		this.cachedPIPRect = { x, y, width: pipWidth, height: pipHeight };
		this.lastPIPSettings = settingsKey;

		return this.cachedPIPRect;
	}

	// ============= DOM Capture Methods =============

	private initializeMediaRecorder(stream: MediaStream): void {
		const options: MediaRecorderOptions = {
			mimeType: this.getSupportedMimeType(),
			videoBitsPerSecond: this.getVideoBitrate(),
			audioBitsPerSecond: 128000
		};

		this.mediaRecorder = new MediaRecorder(stream, options);
		this.recordedChunks = [];

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				this.recordedChunks.push(event.data);
			}
		};

		this.mediaRecorder.onstop = async () => {
			try {
				this.stopCanvasLoop();
				this.stopDOMCaptureLoop();
				this.stopUIUpdateLoop();
				this.stopStreams();
				await this.processRecording();
			} catch (error) {
				console.error('Error processing recording:', error);
				this.onErrorCallback?.(error instanceof Error ? error : new Error(String(error)));
			}
		};

		// Start recording with 2000ms timeslice for better performance
		this.mediaRecorder.start(2000);
	}

	private async captureDOMToCanvas(): Promise<void> {
		// Prevent concurrent captures which can cause performance issues
		if (this.isCapturing) {
			return;
		}

		if (!this.workspaceElement || !this.masterCtx || !this.masterCanvas) return;

		this.isCapturing = true;

		try {
			// Capture the DOM element to a canvas
			const result = await snapdom(this.workspaceElement, {
				backgroundColor: '#ffffff',
				scale: 1
			});

			// Get canvas from result
			const capturedCanvas = await result.toCanvas();

			// Draw the captured canvas to our master canvas
			this.masterCtx.drawImage(
				capturedCanvas,
				0,
				0,
				this.masterCanvas.width,
				this.masterCanvas.height
			);
		} catch (error) {
			console.error('Failed to capture DOM:', error);
		} finally {
			this.isCapturing = false;
		}
	}

	private startDOMCaptureLoop() {
		const frameDuration = 1000 / CAPTURE_FPS;
		let expectedTime = performance.now() + frameDuration;
		let droppedFrames = 0;
		let lastDropLogTime = 0;

		// Helper to schedule next frame with drift correction
		const scheduleNextFrame = () => {
			expectedTime += frameDuration;
			const delay = Math.max(0, expectedTime - performance.now());
			this.domCaptureInterval = window.setTimeout(captureFrame, delay);
		};

		const captureFrame = async () => {
			try {
				// Stop if not recording
				if (!this.isRecording) {
					return;
				}

				const frameStartTime = performance.now();

				// Detect if we're falling behind
				const drift = frameStartTime - expectedTime;
				if (drift > frameDuration) {
					const framesToSkip = Math.floor(drift / frameDuration);
					droppedFrames += framesToSkip;
					expectedTime += framesToSkip * frameDuration;

					// Only log every 5 seconds to avoid performance impact
					if (frameStartTime - lastDropLogTime > 5000) {
						console.warn(
							`[Performance] Dropped ${framesToSkip} frame(s) to catch up, total dropped: ${droppedFrames}`
						);
						lastDropLogTime = frameStartTime;
					}

					// Schedule the next frame and skip processing the current one
					scheduleNextFrame();
					return;
				}

				// Skip frame if paused, but continue loop
				if (this.isPaused) {
					scheduleNextFrame();
					return;
				}

				if (!this.masterCtx || !this.masterCanvas) {
					scheduleNextFrame();
					return;
				}

				// 1. Capture DOM to MASTER canvas
				await this.captureDOMToCanvas();

				// 2. Draw webcam PIP to MASTER canvas
				if (this.settings.includeWebcam && this.webcamVideo && this.webcamStream) {
					this.drawWebcamPIP(this.masterCtx, this.masterCanvas);
				}

				// 3. Draw annotation layer to MASTER canvas
				if (
					this.annotationCanvas &&
					this.annotationCanvas.width > 0 &&
					this.annotationCanvas.height > 0
				) {
					this.masterCtx.drawImage(this.annotationCanvas, 0, 0);
				}

				// 4. UI updates are handled by separate RAF loop for smoother performance
				// No need to call syncToUICanvas() here

				// Schedule next frame with drift correction
				scheduleNextFrame();
			} catch (error) {
				console.error('Error in capture frame:', error);
				// Continue loop even on error to prevent recording from stopping
				scheduleNextFrame();
			}
		};

		captureFrame();
	}

	private stopDOMCaptureLoop() {
		if (this.domCaptureInterval) {
			clearTimeout(this.domCaptureInterval);
			this.domCaptureInterval = null;
		}
	}

	// ============= Recording Control =============

	async startRecording(): Promise<boolean> {
		if (this.isRecording) return false;

		try {
			const isWorkspaceCapture = this.settings.selectedSource === 'workspace';

			// Only use getDisplayMedia if screen or window is selected
			if (this.settings.selectedSource === 'screen' || this.settings.selectedSource === 'window') {
				// Get screen/window stream
				const displayMediaOptions: DisplayMediaStreamOptions = {
					video: {
						displaySurface: this.settings.selectedSource === 'window' ? 'window' : 'monitor'
					} as any,
					audio: this.settings.includeSystemAudio
				};

				this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

				// Setup internal video element for persistence
				await this.setupInternalVideo(this.stream, 'screen');

				// Attach to UI preview if available (legacy support)
				if (this.videoPreviewRef) {
					this.videoPreviewRef.srcObject = this.stream;
					this.videoPreviewRef.play().catch(console.error);
				}
			} else if (isWorkspaceCapture) {
				// For workspace capture, verify we have a workspace element
				if (!this.workspaceElement) {
					throw new Error('No workspace element set for DOM capture');
				}
			}

			// Get webcam stream if enabled
			if (this.settings.includeWebcam) {
				try {
					this.webcamStream = await navigator.mediaDevices.getUserMedia({
						video: { width: 320, height: 240 },
						audio: false
					});

					// Setup internal video element for persistence
					await this.setupInternalVideo(this.webcamStream, 'webcam');

					if (this.webcamPreviewRef) {
						this.webcamPreviewRef.srcObject = this.webcamStream;
						this.webcamPreviewRef.play().catch(console.error);
					}
				} catch (e) {
					console.warn('Could not get webcam stream:', e);
				}
			}

			// Determine dimensions
			let width = DEFAULT_CANVAS_WIDTH;
			let height = DEFAULT_CANVAS_HEIGHT;

			if (isWorkspaceCapture && this.workspaceElement) {
				// Use workspace element dimensions
				const rect = this.workspaceElement.getBoundingClientRect();
				width = rect.width > 0 ? Math.max(rect.width, MIN_CANVAS_WIDTH) : DEFAULT_CANVAS_WIDTH;
				height = rect.height > 0 ? Math.max(rect.height, MIN_CANVAS_HEIGHT) : DEFAULT_CANVAS_HEIGHT;
			} else if (this.stream) {
				// Use video track dimensions for screen/window capture
				const videoTrack = this.stream.getVideoTracks()[0];
				const trackSettings = videoTrack.getSettings();
				width = trackSettings.width || DEFAULT_CANVAS_WIDTH;
				height = trackSettings.height || DEFAULT_CANVAS_HEIGHT;
			}

			// Initialize MASTER canvas
			this.initMasterCanvas(width, height);

			// Start countdown
			if (this.settings.countdownDuration > 0) {
				await this.runCountdown();
			}

			// SET isRecording BEFORE starting the loop
			this.isRecording = true;
			this.isPaused = false;

			// Start memory cleanup for long recordings
			this.startMemoryCleanup();

			// Start appropriate capture loop
			if (isWorkspaceCapture) {
				// DOM capture - set up canvas stream and MediaRecorder before starting loop
				// Start DOM capture loop first (which will continuously update the canvas)
				this.startDOMCaptureLoop();
				// Start separate UI update loop for smooth preview
				this.startUIUpdateLoop();

				// Capture stream from MASTER canvas for recording
				if (this.masterCanvas) {
					this.canvasStream = this.masterCanvas.captureStream(CAPTURE_FPS);
				}

				// Setup MediaRecorder with canvas stream
				const recordingStream = this.canvasStream;
				if (!recordingStream) throw new Error('No stream available for recording');

				this.initializeMediaRecorder(recordingStream);
			} else {
				// Screen/window capture - set up MediaRecorder immediately
				this.startCanvasLoop();
				// Start separate UI update loop for smooth preview
				this.startUIUpdateLoop();

				// Capture stream from MASTER canvas for recording
				if (this.masterCanvas) {
					this.canvasStream = this.masterCanvas.captureStream(CAPTURE_FPS);

					// Add audio track if available (from screen/window capture)
					if (this.stream) {
						const audioTracks = this.stream.getAudioTracks();
						audioTracks.forEach((track) => this.canvasStream!.addTrack(track));
					}
				}

				// Setup MediaRecorder with canvas stream
				const recordingStream = this.canvasStream;
				if (!recordingStream) throw new Error('No stream available for recording');

				this.initializeMediaRecorder(recordingStream);
			}

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

		// Logic moved to mediaRecorder.onstop to ensure it runs
		this.isRecording = false;
		this.isPaused = false;
		this.stopTimer();
		this.onEndCallback?.();
	}

	cancelRecording() {
		// Stop recorder without triggering onEnd processing if possible,
		// or just stop and then reset
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}
		this.cleanup();
		this.reset();
	}

	// ============= Webcam Controls =============

	cycleWebcamPosition() {
		const positions: WebcamPosition[] = [
			'top-left',
			'top-right',
			'bottom-right',
			'bottom-left',
			'center'
		];
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

	addEvent(type: string, data: any) {
		if (this.isRecording) {
			this.recordingEvents.push({
				type,
				data,
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
		// VP8 is prioritized for faster real-time encoding (better performance)
		// VP9 provides better compression but is slower (affects recording quality vs performance trade-off)
		const types = [
			'video/webm;codecs=vp8,opus', // VP8 first - faster encoding
			'video/webm;codecs=vp9,opus',
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

	private startMemoryCleanup() {
		// Run cleanup every 30 seconds
		this.memoryCleanupInterval = window.setInterval(() => {
			try {
				// Consolidate chunks if there are more than the threshold
				if (this.recordedChunks.length > CHUNK_CONSOLIDATION_THRESHOLD) {
					console.log(`[Memory] Offloading consolidation of ${this.recordedChunks.length} chunks`);

					// Keep recent chunks separate for faster access during active recording
					// Only consolidate older chunks to reduce memory pressure
					const chunksToConsolidate = this.recordedChunks.slice(0, -RECENT_CHUNKS_TO_KEEP);
					const recentChunks = this.recordedChunks.slice(-RECENT_CHUNKS_TO_KEEP);

					// Clear immediately to allow new chunks
					this.recordedChunks = [...recentChunks];

					// Use a Web Worker for non-blocking blob consolidation
					const worker = new Worker(new URL('./blob-worker.js', import.meta.url), {
						type: 'module'
					});

					worker.onmessage = (e: MessageEvent) => {
						// Check for error response
						if (e.data.error) {
							console.error('[Memory] Blob consolidation worker error:', e.data.error);
							// If worker fails, put the chunks back to avoid data loss
							this.recordedChunks.unshift(...chunksToConsolidate);
							worker.terminate();
							return;
						}

						// Prepend the consolidated blob to the chunks array
						this.recordedChunks.unshift(e.data);
						console.log('[Memory] Consolidation complete.');
						worker.terminate();
					};

					worker.onerror = (e) => {
						console.error('[Memory] Blob consolidation worker error:', e);
						// If worker fails, put the chunks back to avoid data loss
						this.recordedChunks.unshift(...chunksToConsolidate);
						worker.terminate();
					};

					const mimeType = this.getSupportedMimeType();
					worker.postMessage({ chunks: chunksToConsolidate, mimeType });
				}
			} catch (error) {
				console.error('Error during memory cleanup:', error);
			}
		}, 30000);
	}

	private stopMemoryCleanup() {
		if (this.memoryCleanupInterval) {
			clearInterval(this.memoryCleanupInterval);
			this.memoryCleanupInterval = null;
		}
	}

	stopStreams() {
		this.stream?.getTracks().forEach((t) => t.stop());
		this.webcamStream?.getTracks().forEach((t) => t.stop());
		this.canvasStream?.getTracks().forEach((t) => t.stop());

		this.stream = null;
		this.webcamStream = null;
		this.canvasStream = null;
	}

	cleanup() {
		this.stopTimer();
		this.stopCanvasLoop();
		this.stopDOMCaptureLoop();
		this.stopUIUpdateLoop();
		this.stopMemoryCleanup();

		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}

		this.stopStreams();

		this.mediaRecorder = null;
		this.cachedPIPRect = null;

		// Don't nullify masterCanvas here, allowing it to persist?
		// Actually, on cleanup/reset we generally want to fully reset.
		// But for persistence during navigation, we DON'T call cleanup().
		// cleanup() is called on RESET or CANCEL or ERROR.
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

		// Clear master canvas
		if (this.masterCtx && this.masterCanvas) {
			this.masterCtx.clearRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
		}
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
	setRecordingContextInternal(context);
	return context;
}

export function getRecordingContext(): RecordingContext | undefined {
	try {
		return getRecordingContextInternal();
	} catch {
		return undefined;
	}
}

export function hasRecordingContext(): boolean {
	try {
		return !!getRecordingContextInternal();
	} catch {
		return false;
	}
}
