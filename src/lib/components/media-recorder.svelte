<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import Circle from '@lucide/svelte/icons/circle';
	import Square from '@lucide/svelte/icons/square';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Settings from '@lucide/svelte/icons/settings';
	import Monitor from '@lucide/svelte/icons/monitor';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { fetchFile } from '@ffmpeg/util';

	import AnnotationToolbar from './annotation-toolbar.svelte';
	import VideoPreviewModal from './video-preview-modal.svelte';

	interface Props {
		reviewId: string;
		onUploadComplete?: (result: { videoUrl: string; thumbnailUrl: string; metadata: any }) => void;
		onStart?: () => void;
		maxDuration?: number;
		quality?: 'low' | 'medium' | 'high';
	}

	let {
		reviewId,
		onUploadComplete,
		onStart,
		maxDuration = 600,
		quality = 'high'
	}: Props = $props();

	let isRecording = $state(false);
	let isPaused = $state(false);
	let recordingTime = $state(0);
	let countdown = $state(0);
	let mediaRecorder = $state<MediaRecorder | null>(null);
	let recordedChunks = $state<Blob[]>([]);
	let videoBlob = $state<Blob | null>(null);
	let thumbnail = $state<string>('');
	let stream = $state<MediaStream | null>(null);
	let webcamStream = $state<MediaStream | null>(null);
	let recordingInterval: number;
	let countdownInterval: number;
	let videoPreview = $state<HTMLVideoElement>();
	let webcamPreview = $state<HTMLVideoElement>();

	// Settings
	let selectedSource = $state<'screen' | 'window' | 'camera'>('screen');
	let audioSource = $state<string>('default');
	let includeWebcam = $state(false);
	let includeSystemAudio = $state(true);
	let includeMicAudio = $state(true);
	let countdownDuration = $state(3);
	let showSettings = $state(false);
	let isCompressing = $state(false);
	let compressionProgress = $state(0);
	let availableAudioInputs = $state<MediaDeviceInfo[]>([]);

	// Webcam PIP Settings
	let webcamPosition = $state<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>(
		'bottom-right'
	);
	let webcamSize = $state<'small' | 'medium' | 'large'>('small');
	let webcamShape = $state<'rectangle' | 'circle'>('rectangle');

	// Canvas Compositing State
	let canvasRef: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let annotationCanvas: HTMLCanvasElement | null = null;
	let annotationCtx: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;

	// Annotations State
	let isDrawing = $state(false);
	let currentTool = $state({ type: 'pen' as const, color: '#ff0000', strokeWidth: 3 });
	let annotationHistory = $state<ImageData[]>([]);
	let historyIndex = $state(-1);
	let isToolbarVisible = $state(true);
	let startPoint = $state<{ x: number; y: number } | null>(null);
	let tempCanvas: HTMLCanvasElement | null = null;
	let tempCtx: CanvasRenderingContext2D | null = null;

	// Text tool state
	let textInputVisible = $state(false);
	let textInputPosition = $state({ x: 0, y: 0 });
	let textInputValue = $state('');
	let textInputRef: HTMLInputElement | null = null;

	// Preview Modal State
	let showPreviewModal = $state(false);
	let recordedVideoUrl = $state('');
	let videoDuration = $state(0);

	const supportsScreenCapture = $derived(
		typeof navigator !== 'undefined' &&
			'mediaDevices' in navigator &&
			'getDisplayMedia' in navigator.mediaDevices
	);

	$effect(() => {
		if (typeof navigator !== 'undefined') {
			navigator.mediaDevices.enumerateDevices().then((devices) => {
				availableAudioInputs = devices.filter((d) => d.kind === 'audioinput');
			});

			// Auto-switch to camera if screen capture isn't supported
			if (!supportsScreenCapture) {
				selectedSource = 'camera';
			}
		}
	});

	// NOTE: Canvas initialization is now handled in beginRecording() directly
	// to avoid race conditions with the $effect

	// Helper to convert mouse event coordinates to canvas coordinates
	function getCanvasCoordinates(e: MouseEvent): { x: number; y: number } {
		const rect = canvasRef.getBoundingClientRect();
		// Scale from CSS pixels to canvas internal pixels
		const scaleX = canvasRef.width / rect.width;
		const scaleY = canvasRef.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	// Calculate webcam PIP position and size based on settings
	function getWebcamPIPRect(): { x: number; y: number; width: number; height: number } {
		const sizeMultipliers = { small: 0.15, medium: 0.2, large: 0.3 };
		const multiplier = sizeMultipliers[webcamSize];
		const pipWidth = canvasRef.width * multiplier;
		const pipHeight = pipWidth * (3 / 4);
		const margin = 16;

		let x = 0,
			y = 0;
		switch (webcamPosition) {
			case 'top-left':
				x = margin;
				y = margin;
				break;
			case 'top-right':
				x = canvasRef.width - pipWidth - margin;
				y = margin;
				break;
			case 'bottom-left':
				x = margin;
				y = canvasRef.height - pipHeight - margin;
				break;
			case 'bottom-right':
				x = canvasRef.width - pipWidth - margin;
				y = canvasRef.height - pipHeight - margin;
				break;
			case 'center':
				x = (canvasRef.width - pipWidth) / 2;
				y = (canvasRef.height - pipHeight) / 2;
				break;
		}
		return { x, y, width: pipWidth, height: pipHeight };
	}

	// Canvas compositing loop - draws video + webcam + annotations onto main canvas
	function startCanvasLoop() {
		const drawFrame = () => {
			// Skip if not recording or missing required elements
			if (!ctx || !videoPreview || !isRecording) {
				if (isRecording) {
					// Keep trying if we're recording but elements aren't ready
					animationFrameId = requestAnimationFrame(drawFrame);
				}
				return;
			}

			// Skip if canvas has no dimensions
			if (canvasRef.width === 0 || canvasRef.height === 0) {
				animationFrameId = requestAnimationFrame(drawFrame);
				return;
			}

			// Skip drawing if paused (but keep the loop running)
			if (isPaused) {
				animationFrameId = requestAnimationFrame(drawFrame);
				return;
			}

			// Draw video frame
			try {
				ctx.drawImage(videoPreview, 0, 0, canvasRef.width, canvasRef.height);
			} catch (e) {
				// Video might not be ready yet
				animationFrameId = requestAnimationFrame(drawFrame);
				return;
			}

			// Draw webcam PIP if enabled
			if (includeWebcam && webcamPreview && webcamStream) {
				const pip = getWebcamPIPRect();

				ctx.save();

				// Draw shadow/border
				ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
				ctx.shadowBlur = 10;
				ctx.fillStyle = '#000';

				if (webcamShape === 'circle') {
					// Circle shape with clipping
					const centerX = pip.x + pip.width / 2;
					const centerY = pip.y + pip.height / 2;
					const radius = Math.min(pip.width, pip.height) / 2;

					// Draw circle background/border
					ctx.beginPath();
					ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
					ctx.fill();
					ctx.shadowBlur = 0;

					// Clip to circle and draw webcam
					ctx.beginPath();
					ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
					ctx.clip();

					try {
						ctx.drawImage(webcamPreview, pip.x, pip.y, pip.width, pip.height);
					} catch (e) {
						// Webcam might not be ready
					}
				} else {
					// Rectangle shape
					ctx.fillRect(pip.x - 2, pip.y - 2, pip.width + 4, pip.height + 4);
					ctx.shadowBlur = 0;

					// Draw webcam feed
					try {
						ctx.drawImage(webcamPreview, pip.x, pip.y, pip.width, pip.height);
					} catch (e) {
						// Webcam might not be ready
					}
				}

				ctx.restore();
			}

			// Draw annotation layer on top (only if it has dimensions)
			if (annotationCanvas && annotationCanvas.width > 0 && annotationCanvas.height > 0) {
				ctx.drawImage(annotationCanvas, 0, 0);
			}

			// Draw temp canvas (for shape preview while drawing)
			if (
				tempCanvas &&
				tempCanvas.width > 0 &&
				tempCanvas.height > 0 &&
				isDrawing &&
				['arrow', 'rectangle', 'circle'].includes(currentTool.type)
			) {
				ctx.drawImage(tempCanvas, 0, 0);
			}

			animationFrameId = requestAnimationFrame(drawFrame);
		};

		drawFrame();
	}

	function stopCanvasLoop() {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	// Utility function for highlighter color
	function hexToRgba(hex: string, alpha: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	async function startRecording() {
		if (countdownDuration > 0) {
			countdown = countdownDuration;
			countdownInterval = window.setInterval(() => {
				countdown--;
				if (countdown === 0) {
					clearInterval(countdownInterval);
					beginRecording();
				}
			}, 1000);
		} else {
			await beginRecording();
		}
	}

	async function beginRecording() {
		try {
			const videoConstraints: any = {
				video: {
					cursor: 'always',
					displaySurface: selectedSource === 'window' ? 'window' : 'monitor'
				}
			};

			if (selectedSource === 'camera') {
				stream = await navigator.mediaDevices.getUserMedia({
					video: { width: 1280, height: 720 },
					audio: includeMicAudio
						? {
								deviceId: audioSource !== 'default' ? { exact: audioSource } : undefined,
								echoCancellation: true,
								noiseSuppression: true
							}
						: false
				});
			} else {
				if (!supportsScreenCapture) throw new Error('Screen capture not supported on this device');
				stream = await navigator.mediaDevices.getDisplayMedia({
					video: videoConstraints.video,
					audio: includeSystemAudio
				});

				// Add microphone audio if requested
				if (includeMicAudio) {
					const micStream = await navigator.mediaDevices.getUserMedia({
						audio: {
							deviceId: audioSource !== 'default' ? { exact: audioSource } : undefined,
							echoCancellation: true,
							noiseSuppression: true
						}
					});

					// Mix audio tracks
					const audioContext = new AudioContext();
					const destination = audioContext.createMediaStreamDestination();

					stream.getAudioTracks().forEach((track) => {
						const source = audioContext.createMediaStreamSource(new MediaStream([track]));
						source.connect(destination);
					});

					micStream
						.getAudioTracks()
						.forEach((t) =>
							audioContext.createMediaStreamSource(new MediaStream([t])).connect(destination)
						);

					// Replace audio track
					stream.getAudioTracks().forEach((track) => track.stop());
					destination.stream.getAudioTracks().forEach((track) => stream!.addTrack(track));
				}
			}

			// Webcam PIP
			if (includeWebcam && selectedSource !== 'camera') {
				webcamStream = await navigator.mediaDevices.getUserMedia({
					video: { width: 320, height: 240 }
				});
				if (webcamPreview) {
					webcamPreview.srcObject = webcamStream;
					await webcamPreview.play();
				}
			}

			// Set video source and wait for it to be ready
			if (videoPreview) {
				videoPreview.srcObject = stream;
				await videoPreview.play();
			}

			// Wait for video to have actual frames
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error('Timeout waiting for video frames'));
				}, 10000);

				const checkReady = () => {
					if (videoPreview && videoPreview.readyState >= 2 && videoPreview.videoWidth > 0) {
						clearTimeout(timeout);
						resolve();
					} else {
						requestAnimationFrame(checkReady);
					}
				};
				checkReady();
			});

			// Initialize canvas with proper dimensions based on video
			const videoWidth = videoPreview?.videoWidth || 1280;
			const videoHeight = videoPreview?.videoHeight || 720;

			// Create in-memory canvases (these don't need to be in the DOM)
			if (!annotationCanvas) {
				annotationCanvas = document.createElement('canvas');
			}
			annotationCanvas.width = videoWidth;
			annotationCanvas.height = videoHeight;
			annotationCtx = annotationCanvas.getContext('2d');

			if (!tempCanvas) {
				tempCanvas = document.createElement('canvas');
			}
			tempCanvas.width = videoWidth;
			tempCanvas.height = videoHeight;
			tempCtx = tempCanvas.getContext('2d');

			// Set recording state FIRST - this causes Svelte to render the canvas element
			isRecording = true;
			recordingTime = 0;

			// Wait for Svelte to render the canvas element
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Now the canvas should exist in the DOM
			if (!canvasRef) {
				throw new Error('Canvas element not available after render');
			}

			// Set canvas dimensions
			canvasRef.width = videoWidth;
			canvasRef.height = videoHeight;
			ctx = canvasRef.getContext('2d');

			// Draw initial frame to canvas
			if (ctx && videoPreview) {
				ctx.drawImage(videoPreview, 0, 0, canvasRef.width, canvasRef.height);
			}

			// Start the canvas compositing loop
			startCanvasLoop();

			// Wait a frame to ensure canvas has content
			await new Promise((resolve) => requestAnimationFrame(resolve));

			// Save initial annotation state for undo
			if (annotationCtx && annotationCanvas) {
				const initialData = annotationCtx.getImageData(
					0,
					0,
					annotationCanvas.width,
					annotationCanvas.height
				);
				annotationHistory = [initialData];
				historyIndex = 0;
			}

			const qualitySettings = {
				low: { videoBitsPerSecond: 1000000 },
				medium: { videoBitsPerSecond: 2500000 },
				high: { videoBitsPerSecond: 5000000 }
			};

			// IMPORTANT: Capture from the composited canvas, not the raw stream!
			// This ensures annotations and webcam PIP are included in the recording
			const canvasStream = canvasRef.captureStream(30);

			// Add audio tracks from the original stream
			stream.getAudioTracks().forEach((track) => {
				canvasStream.addTrack(track);
			});

			mediaRecorder = new MediaRecorder(canvasStream, {
				mimeType: 'video/webm;codecs=vp9,opus',
				...qualitySettings[quality]
			});

			recordedChunks = [];
			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) recordedChunks.push(e.data);
			};

			mediaRecorder.onstop = async () => {
				const blob = new Blob(recordedChunks, { type: 'video/webm' });

				// Generate thumbnail
				thumbnail = await generateThumbnail(blob);

				// Compress if needed
				if (quality !== 'high' && blob.size > 10 * 1024 * 1024) {
					// > 10MB
					toast
						.promise(compressVideo(blob), {
							loading: 'Compressing video...',
							success: (compressed) => {
								videoBlob = compressed;
								return `Compressed from ${(blob.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`;
							},
							error: 'Compression failed, using original'
						})
						.then((compressed) => {
							videoBlob = compressed;
						})
						.catch(() => {
							videoBlob = blob;
						});
				} else {
					videoBlob = blob;
				}

				recordedVideoUrl = URL.createObjectURL(blob);

				// Get duration for preview
				const tempVideo = document.createElement('video');
				tempVideo.src = recordedVideoUrl;
				await new Promise((r) => {
					tempVideo.onloadedmetadata = () => {
						videoDuration = tempVideo.duration;
						r(null);
					};
				});

				// Show Preview Modal
				showPreviewModal = true;

				// Stop canvas loop
				stopCanvasLoop();

				// Stop all tracks
				stream?.getTracks().forEach((t) => t.stop());
				webcamStream?.getTracks().forEach((t) => t.stop());
			};

			mediaRecorder.start(1000);
			onStart?.();

			recordingInterval = window.setInterval(() => {
				recordingTime++;
				if (recordingTime >= maxDuration) {
					stopRecording();
					toast.warning('Maximum recording duration reached');
				}
			}, 1000);
		} catch (error: any) {
			// If we failed, reset recording state
			isRecording = false;
			stopCanvasLoop();

			console.error('Error starting recording:', error);

			if (error.name === 'NotAllowedError') {
				toast.error('Camera/screen permission denied. Please allow access and try again.');
			} else if (error.name === 'NotFoundError') {
				toast.error('No camera or screen capture device found.');
			} else if (error.name === 'AbortError') {
				toast.error('Recording was aborted. Please try again.');
			} else {
				toast.error('Failed to start recording: ' + error.message);
			}
		}
	}

	function pauseRecording() {
		if (mediaRecorder?.state === 'recording') {
			mediaRecorder.pause();
			isPaused = true;
			clearInterval(recordingInterval);
		}
	}

	function resumeRecording() {
		if (mediaRecorder?.state === 'paused') {
			mediaRecorder.resume();
			isPaused = false;

			recordingInterval = window.setInterval(() => {
				recordingTime++;
				if (recordingTime >= maxDuration) {
					stopRecording();
				}
			}, 1000);
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			isRecording = false;
			isPaused = false;
			clearInterval(recordingInterval);
		}
	}

	function resetRecording() {
		videoBlob = null;
		thumbnail = '';
		recordedChunks = [];
		recordingTime = 0;
		annotationHistory = [];
		historyIndex = -1;

		// Clear annotation canvas
		if (annotationCtx && annotationCanvas) {
			annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
		}
	}

	// ============================================================================
	// ANNOTATION TOOL HANDLERS
	// ============================================================================

	function saveAnnotationState() {
		if (!annotationCtx || !annotationCanvas) return;
		// Don't save if canvas has no dimensions
		if (annotationCanvas.width === 0 || annotationCanvas.height === 0) return;
		const data = annotationCtx.getImageData(0, 0, annotationCanvas.width, annotationCanvas.height);
		// Truncate history if we're in the middle of undo
		annotationHistory = [...annotationHistory.slice(0, historyIndex + 1), data];
		historyIndex++;
	}

	function handleUndo() {
		if (historyIndex > 0 && annotationCtx && annotationCanvas) {
			historyIndex--;
			annotationCtx.putImageData(annotationHistory[historyIndex], 0, 0);
		}
	}

	function handleRedo() {
		if (historyIndex < annotationHistory.length - 1 && annotationCtx && annotationCanvas) {
			historyIndex++;
			annotationCtx.putImageData(annotationHistory[historyIndex], 0, 0);
		}
	}

	function handleClear() {
		if (annotationCtx && annotationCanvas) {
			annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
			saveAnnotationState();
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (!annotationCtx || !annotationCanvas || !isRecording) return;
		// Don't allow drawing if canvas has no dimensions
		if (annotationCanvas.width === 0 || annotationCanvas.height === 0) return;

		// Convert CSS coordinates to canvas coordinates
		const { x, y } = getCanvasCoordinates(e);

		startPoint = { x, y };
		isDrawing = true;

		switch (currentTool.type) {
			case 'pen':
			case 'highlighter':
				annotationCtx.beginPath();
				annotationCtx.moveTo(x, y);
				annotationCtx.strokeStyle =
					currentTool.type === 'highlighter'
						? hexToRgba(currentTool.color, 0.4)
						: currentTool.color;
				annotationCtx.lineWidth =
					currentTool.type === 'highlighter'
						? currentTool.strokeWidth * 3
						: currentTool.strokeWidth;
				annotationCtx.lineCap = 'round';
				annotationCtx.lineJoin = 'round';
				break;

			case 'text':
				// Show text input at click position
				textInputPosition = { x, y };
				textInputValue = '';
				textInputVisible = true;
				isDrawing = false;
				// Focus the input after it renders
				setTimeout(() => textInputRef?.focus(), 10);
				break;

			case 'arrow':
			case 'rectangle':
			case 'circle':
				// Clear temp canvas for preview
				if (tempCtx && tempCanvas) {
					tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
				}
				break;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDrawing || !startPoint) return;

		const { x, y } = getCanvasCoordinates(e);

		switch (currentTool.type) {
			case 'pen':
			case 'highlighter':
				if (annotationCtx) {
					annotationCtx.lineTo(x, y);
					annotationCtx.stroke();
				}
				break;

			case 'arrow':
				drawArrowPreview(startPoint.x, startPoint.y, x, y);
				break;

			case 'rectangle':
				drawRectanglePreview(startPoint.x, startPoint.y, x, y);
				break;

			case 'circle':
				drawCirclePreview(startPoint.x, startPoint.y, x, y);
				break;
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDrawing || !startPoint) {
			isDrawing = false;
			return;
		}

		const { x, y } = getCanvasCoordinates(e);

		switch (currentTool.type) {
			case 'pen':
			case 'highlighter':
				// Path already drawn, just save state
				break;

			case 'arrow':
				drawArrow(annotationCtx!, startPoint.x, startPoint.y, x, y);
				break;

			case 'rectangle':
				drawRectangle(annotationCtx!, startPoint.x, startPoint.y, x, y);
				break;

			case 'circle':
				drawCircle(annotationCtx!, startPoint.x, startPoint.y, x, y);
				break;
		}

		// Clear temp canvas
		if (tempCtx && tempCanvas) {
			tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		}

		isDrawing = false;
		startPoint = null;
		saveAnnotationState();
	}

	// Shape drawing functions
	function drawArrowPreview(x1: number, y1: number, x2: number, y2: number) {
		if (!tempCtx || !tempCanvas) return;
		tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		drawArrow(tempCtx, x1, y1, x2, y2);
	}

	function drawArrow(
		ctx: CanvasRenderingContext2D,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	) {
		const headLength = 15;
		const angle = Math.atan2(y2 - y1, x2 - x1);

		ctx.beginPath();
		ctx.strokeStyle = currentTool.color;
		ctx.lineWidth = currentTool.strokeWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// Arrow shaft
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);

		// Arrow head
		ctx.lineTo(
			x2 - headLength * Math.cos(angle - Math.PI / 6),
			y2 - headLength * Math.sin(angle - Math.PI / 6)
		);
		ctx.moveTo(x2, y2);
		ctx.lineTo(
			x2 - headLength * Math.cos(angle + Math.PI / 6),
			y2 - headLength * Math.sin(angle + Math.PI / 6)
		);

		ctx.stroke();
	}

	function drawRectanglePreview(x1: number, y1: number, x2: number, y2: number) {
		if (!tempCtx || !tempCanvas) return;
		tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		drawRectangle(tempCtx, x1, y1, x2, y2);
	}

	function drawRectangle(
		ctx: CanvasRenderingContext2D,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	) {
		ctx.beginPath();
		ctx.strokeStyle = currentTool.color;
		ctx.lineWidth = currentTool.strokeWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
	}

	function drawCirclePreview(x1: number, y1: number, x2: number, y2: number) {
		if (!tempCtx || !tempCanvas) return;
		tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		drawCircle(tempCtx, x1, y1, x2, y2);
	}

	function drawCircle(
		ctx: CanvasRenderingContext2D,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	) {
		const centerX = (x1 + x2) / 2;
		const centerY = (y1 + y2) / 2;
		const radiusX = Math.abs(x2 - x1) / 2;
		const radiusY = Math.abs(y2 - y1) / 2;

		ctx.beginPath();
		ctx.strokeStyle = currentTool.color;
		ctx.lineWidth = currentTool.strokeWidth;
		ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
		ctx.stroke();
	}

	// Text tool handlers
	function handleTextInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			commitText();
		} else if (e.key === 'Escape') {
			textInputVisible = false;
			textInputValue = '';
		}
	}

	function commitText() {
		if (!annotationCtx || !textInputValue.trim()) {
			textInputVisible = false;
			textInputValue = '';
			return;
		}

		const fontSize = Math.max(16, currentTool.strokeWidth * 6);
		annotationCtx.font = `${fontSize}px sans-serif`;
		annotationCtx.fillStyle = currentTool.color;
		annotationCtx.textBaseline = 'top';

		// Handle multi-line text
		const lines = textInputValue.split('\n');
		lines.forEach((line, index) => {
			annotationCtx!.fillText(
				line,
				textInputPosition.x,
				textInputPosition.y + index * (fontSize * 1.2)
			);
		});

		saveAnnotationState();
		textInputVisible = false;
		textInputValue = '';
	}

	async function compressVideo(blob: Blob): Promise<Blob> {
		isCompressing = true;
		compressionProgress = 0;

		try {
			const ffmpeg = new FFmpeg();

			ffmpeg.on('progress', ({ progress }) => {
				compressionProgress = Math.round(progress * 100);
			});

			await ffmpeg.load();

			const inputName = 'input.webm';
			const outputName = 'output.mp4';

			await ffmpeg.writeFile(inputName, await fetchFile(blob));

			// Compress with h264 codec
			await ffmpeg.exec([
				'-i',
				inputName,
				'-c:v',
				'libx264',
				'-crf',
				'28',
				'-preset',
				'fast',
				'-c:a',
				'aac',
				'-b:a',
				'128k',
				outputName
			]);

			const data = await ffmpeg.readFile(outputName);
			return new Blob([data], { type: 'video/mp4' });
		} finally {
			isCompressing = false;
			compressionProgress = 0;
		}
	}

	function handleSaveVideo(metadata: any) {
		if (metadata.videoUrl) {
			onUploadComplete?.({
				videoUrl: metadata.videoUrl,
				thumbnailUrl: metadata.thumbnailUrl,
				metadata: {
					...metadata.metadata,
					title: metadata.title,
					description: metadata.description
				}
			});
			showPreviewModal = false;
		}
	}

	function handleDiscard() {
		showPreviewModal = false;
		videoBlob = null;
		recordedChunks = [];
	}

	// Utilities
	async function generateThumbnail(blob: Blob): Promise<string> {
		return new Promise((resolve) => {
			const video = document.createElement('video');
			video.src = URL.createObjectURL(blob);

			video.addEventListener('loadeddata', () => {
				video.currentTime = Math.min(2, video.duration / 2);
			});

			video.addEventListener('seeked', () => {
				const canvas = document.createElement('canvas');
				canvas.width = 640;
				canvas.height = 360;

				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

				resolve(canvas.toDataURL('image/jpeg', 0.8));
				URL.revokeObjectURL(video.src);
			});
		});
	}

	function formatTime(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleUseRecording() {
		if (videoBlob && thumbnail) {
			// Just open preview modal for upload
			showPreviewModal = true;
		}
	}

	$effect(() => {
		return () => {
			clearInterval(recordingInterval);
			clearInterval(countdownInterval);
			stopCanvasLoop();
			stream?.getTracks().forEach((t) => t.stop());
			webcamStream?.getTracks().forEach((t) => t.stop());
		};
	});
</script>

<Card>
	<CardContent class="p-6 space-y-4">
		<div class="relative aspect-video bg-muted rounded-lg overflow-hidden group">
			{#if countdown > 0}
				<div class="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
					<div class="text-center text-white">
						<div class="text-8xl font-bold mb-4">{countdown}</div>
						<p class="text-lg">Get ready...</p>
					</div>
				</div>
			{:else if !isRecording && !videoBlob}
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<Monitor class="h-16 w-16 text-muted-foreground mb-4" />
					<p class="text-sm text-muted-foreground">Select recording source and click start</p>
					{#if !supportsScreenCapture}
						<Badge variant="secondary" class="mt-2"
							>Screen recording unavailable on this device</Badge
						>
					{/if}
				</div>
			{/if}

			<!-- Hidden video elements - always in DOM so they exist before recording starts -->
			<video bind:this={videoPreview} class="hidden" muted playsinline
				><track kind="captions" /></video
			>
			<video bind:this={webcamPreview} class="hidden" muted playsinline
				><track kind="captions" /></video
			>

			{#if isRecording || isPaused}
				<!-- Main composited canvas (what gets recorded) -->
				<canvas
					bind:this={canvasRef}
					class="absolute inset-0 w-full h-full cursor-crosshair z-10"
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					onmouseleave={handleMouseUp}
				></canvas>

				<!-- Text input overlay for text tool -->
				{#if textInputVisible}
					<div
						class="absolute z-30 bg-transparent"
						style="left: {textInputPosition.x}px; top: {textInputPosition.y}px;"
					>
						<input
							bind:this={textInputRef}
							bind:value={textInputValue}
							type="text"
							class="bg-transparent border-none outline-none text-lg"
							style="color: {currentTool.color}; font-size: {Math.max(
								16,
								currentTool.strokeWidth * 6
							)}px;"
							placeholder="Type text..."
							onkeydown={handleTextInputKeydown}
							onblur={commitText}
						/>
					</div>
				{/if}

				<div
					class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<AnnotationToolbar
						{currentTool}
						visible={isToolbarVisible}
						canUndo={historyIndex > 0}
						canRedo={historyIndex < annotationHistory.length - 1}
						onUndo={handleUndo}
						onRedo={handleRedo}
						onClear={handleClear}
						onToolChange={(tool) => (currentTool = tool)}
						onToggleVisibility={() => (isToolbarVisible = !isToolbarVisible)}
					/>
				</div>

				<div
					class="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg z-20"
				>
					<div
						class="h-3 w-3 rounded-full {isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}"
					></div>
					<span class="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
					<span class="text-white/60 text-xs">/ {formatTime(maxDuration)}</span>
				</div>

				{#if isPaused}
					<div class="absolute inset-0 flex items-center justify-center bg-black/40">
						<Badge variant="secondary" class="text-lg px-4 py-2">Paused</Badge>
					</div>
				{/if}
			{:else if videoBlob}
				<!-- Video Preview -->
				<video src={URL.createObjectURL(videoBlob)} class="w-full h-full object-contain" controls
					><track kind="captions" /></video
				>
			{/if}
		</div>

		{#if !isRecording && !videoBlob}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label>Recording Settings</Label>
					<Button variant="ghost" size="sm" onclick={() => (showSettings = !showSettings)}>
						<Settings class="h-4 w-4 mr-2" />
						{showSettings ? 'Hide' : 'Show'} Advanced
					</Button>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label>Source</Label>
						<Select type="single" bind:value={selectedSource}>
							<SelectTrigger>{selectedSource}</SelectTrigger>
							<SelectContent>
								<SelectItem value="screen" disabled={!supportsScreenCapture}>
									Entire Screen {!supportsScreenCapture ? '(Not Supported)' : ''}
								</SelectItem>
								<SelectItem value="window" disabled={!supportsScreenCapture}>
									Window {!supportsScreenCapture ? '(Not Supported)' : ''}
								</SelectItem>
								<SelectItem value="camera">Camera</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{#if availableAudioInputs.length > 0}
						<div class="space-y-2">
							<Label>Microphone</Label>
							<Select type="single" bind:value={audioSource}>
								<SelectTrigger class="w-full truncate">{audioSource}</SelectTrigger>
								<SelectContent>
									<SelectItem value="default">Default</SelectItem>
									{#each availableAudioInputs as device}
										<SelectItem value={device.deviceId}>{device.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>
					{/if}
				</div>

				{#if showSettings}
					<div class="space-y-4 pt-4 border-t">
						{#if selectedSource !== 'camera'}
							<div class="flex items-center justify-between">
								<div class="space-y-0.5">
									<Label>Include Webcam (Picture-in-Picture)</Label>
									<p class="text-sm text-muted-foreground">Show your webcam in corner</p>
								</div>
								<Switch bind:checked={includeWebcam} />
							</div>

							{#if includeWebcam}
								<div class="ml-4 space-y-3 pt-2 border-l-2 border-muted pl-4">
									<div class="space-y-2">
										<Label class="text-sm">Position</Label>
										<Select type="single" bind:value={webcamPosition}>
											<SelectTrigger class="h-8">{webcamPosition}</SelectTrigger>
											<SelectContent>
												<SelectItem value="top-left">Top Left</SelectItem>
												<SelectItem value="top-right">Top Right</SelectItem>
												<SelectItem value="bottom-left">Bottom Left</SelectItem>
												<SelectItem value="bottom-right">Bottom Right</SelectItem>
												<SelectItem value="center">Center</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div class="space-y-2">
										<Label class="text-sm">Size</Label>
										<Select type="single" bind:value={webcamSize}>
											<SelectTrigger class="h-8">{webcamSize}</SelectTrigger>
											<SelectContent>
												<SelectItem value="small">Small (15%)</SelectItem>
												<SelectItem value="medium">Medium (20%)</SelectItem>
												<SelectItem value="large">Large (30%)</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div class="space-y-2">
										<Label class="text-sm">Shape</Label>
										<Select type="single" bind:value={webcamShape}>
											<SelectTrigger class="h-8">{webcamShape}</SelectTrigger>
											<SelectContent>
												<SelectItem value="rectangle">Rectangle</SelectItem>
												<SelectItem value="circle">Circle</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							{/if}
						{/if}

						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label>System Audio</Label>
								<p class="text-sm text-muted-foreground">Record computer audio</p>
							</div>
							<Switch bind:checked={includeSystemAudio} />
						</div>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label>Microphone Audio</Label>
								<p class="text-sm text-muted-foreground">Record your voice</p>
							</div>
							<Switch bind:checked={includeMicAudio} />
						</div>
						<div class="space-y-2">
							<Label>Countdown Duration</Label>
							<Select type="single" bind:value={countdownDuration}>
								<SelectTrigger>
									{countdownDuration || ''}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={0}>No countdown</SelectItem>
									<SelectItem value={3}>3 seconds</SelectItem>
									<SelectItem value={5}>5 seconds</SelectItem>
									<SelectItem value={10}>10 seconds</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Compression Progress -->
		{#if isCompressing}
			<div class="space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span>Compressing video...</span>
					<span>{compressionProgress}%</span>
				</div>
				<div class="h-2 bg-muted rounded-full overflow-hidden">
					<div
						class="h-full bg-primary transition-all duration-300"
						style="width: {compressionProgress}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Controls -->
		<div class="flex items-center justify-center gap-2">
			{#if !isRecording && !videoBlob && countdown === 0}
				<Button onclick={startRecording} size="lg" class="gap-2">
					<Circle class="h-5 w-5" />
					Start Recording
				</Button>
			{:else if countdown > 0}
				<Button
					onclick={() => {
						clearInterval(countdownInterval);
						countdown = 0;
					}}
					size="lg"
					variant="outline"
				>
					Cancel
				</Button>
			{:else if isRecording}
				<Button
					onclick={isPaused ? resumeRecording : pauseRecording}
					size="lg"
					variant="secondary"
					class="gap-2"
				>
					{#if isPaused}
						<Play class="h-5 w-5" />
						Resume
					{:else}
						<Pause class="h-5 w-5" />
						Pause
					{/if}
				</Button>
				<Button onclick={stopRecording} size="lg" variant="destructive" class="gap-2">
					<Square class="h-5 w-5" />
					Stop
				</Button>
			{:else if videoBlob}
				<Button variant="outline" onclick={resetRecording}>Record Again</Button>
				<Button onclick={handleUseRecording}>Use This Recording</Button>
			{/if}
		</div>
		{#if videoBlob}
			<div class="text-sm text-center text-muted-foreground">
				Duration: {formatTime(recordingTime)} • Size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB
			</div>
		{/if}
	</CardContent>
</Card>

{#if showPreviewModal}
	<VideoPreviewModal
		bind:open={showPreviewModal}
		videoUrl={recordedVideoUrl}
		{reviewId}
		onSave={handleSaveVideo}
		onReRecord={() => {
			handleDiscard();
			startRecording();
		}}
		onDiscard={handleDiscard}
	/>
{/if}
