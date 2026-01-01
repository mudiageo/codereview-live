<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { toast } from 'svelte-sonner';
	import Circle from '@lucide/svelte/icons/circle';
	import Square from '@lucide/svelte/icons/square';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Settings from '@lucide/svelte/icons/settings';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import {
		getRecordingContext,
		type RecordingContext,
		type WebcamPosition,
		type WebcamSize,
		type WebcamShape
	} from '$lib/contexts/recording-context.svelte';

	import AnnotationToolbar from './annotation-toolbar.svelte';
	import VideoPreviewModal from './video-preview-modal.svelte';

	interface Props {
		reviewId: string;
		onUploadComplete?: (result: { videoUrl: string; thumbnailUrl: string; metadata: any }) => void;
	}

	let { reviewId, onUploadComplete }: Props = $props();

	// Get recording context - ALL state and logic comes from here
	const ctx = getRecordingContext();
	if (!ctx) {
		throw new Error('MediaRecorder must be used within a component that provides RecordingContext');
	}

	// UI-only local state (not recording logic)
	let showSettings = $state(false);
	let videoPreview = $state<HTMLVideoElement>();
	let webcamPreview = $state<HTMLVideoElement>();
	let canvasRef = $state<HTMLCanvasElement>();
	let canvasCtx: CanvasRenderingContext2D | null = null;
	let annotationCanvas: HTMLCanvasElement | null = null;
	let annotationCtx: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;

	// Annotations State (UI-only, could be moved to context if needed)
	let isDrawing = $state(false);
	let currentTool = $state({ type: 'pen' as const, color: '#ff0000', strokeWidth: 3 });
	let annotationHistory = $state<ImageData[]>([]);
	let historyIndex = $state(-1);
	let isToolbarVisible = $state(true);
	let textInputVisible = $state(false);
	let textInputPosition = $state({ x: 0, y: 0 });
	let textInputValue = $state('');
	let textInputRef: HTMLInputElement | null = null;

	// Derived state from context
	const isRecording = $derived(ctx.isRecording);
	const isPaused = $derived(ctx.isPaused);
	const recordingTime = $derived(ctx.recordingTime);
	const countdown = $derived(ctx.countdown);
	const videoBlob = $derived(ctx.videoBlob);
	const recordedVideoUrl = $derived(ctx.recordedVideoUrl);
	const thumbnail = $derived(ctx.thumbnail);
	const showPreviewModal = $derived(ctx.showPreviewModal);
	const settings = $derived(ctx.settings);

	// Screen capture support check
	const supportsScreenCapture = $derived(
		typeof navigator !== 'undefined' &&
			'mediaDevices' in navigator &&
			'getDisplayMedia' in navigator.mediaDevices
	);

	// ============= Keyboard Shortcuts =============
	function handleKeyDown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
			return;
		}

		const key = e.key.toLowerCase();

		// Recording controls
		if (key === 'r' && !isRecording && countdown === 0) {
			e.preventDefault();
			ctx.startRecording();
		} else if (key === 's' && isRecording) {
			e.preventDefault();
			ctx.stopRecording();
		} else if ((key === ' ' || key === 'p') && isRecording) {
			e.preventDefault();
			ctx.togglePause();
		} else if (key === 'escape' && (isRecording || countdown > 0)) {
			e.preventDefault();
			ctx.cancelRecording();
		}

		// Webcam controls during recording
		if (isRecording && settings.includeWebcam) {
			if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
				e.preventDefault();
				handleWebcamPositionKey(key);
			} else if (key === '+' || key === '=') {
				e.preventDefault();
				ctx.cycleWebcamSize();
				toast.info(`Webcam size: ${settings.webcamSize}`);
			} else if (key === '-' || key === '_') {
				e.preventDefault();
				// Cycle backwards not implemented, just cycle forward
			} else if (key === 'c') {
				e.preventDefault();
				ctx.toggleWebcamShape();
				toast.info(`Webcam shape: ${settings.webcamShape}`);
			}
		}
	}

	function handleWebcamPositionKey(key: string) {
		const positionMap: Record<string, Record<string, WebcamPosition>> = {
			arrowup: {
				'bottom-left': 'top-left',
				'bottom-right': 'top-right',
				center: 'top-right'
			},
			arrowdown: {
				'top-left': 'bottom-left',
				'top-right': 'bottom-right',
				center: 'bottom-right'
			},
			arrowleft: {
				'top-right': 'top-left',
				'bottom-right': 'bottom-left',
				center: 'bottom-left'
			},
			arrowright: {
				'top-left': 'top-right',
				'bottom-left': 'bottom-right',
				center: 'bottom-right'
			}
		};

		const newPosition = positionMap[key]?.[settings.webcamPosition];
		if (newPosition) {
			ctx.setWebcamPosition(newPosition);
			toast.info(`Webcam: ${newPosition}`);
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
		}
		stopCanvasLoop();
	});

	// ============= Canvas Compositing =============
	function initCanvas() {
		if (!canvasRef) return;
		canvasCtx = canvasRef.getContext('2d');

		// Create offscreen annotation canvas
		annotationCanvas = document.createElement('canvas');
		annotationCtx = annotationCanvas.getContext('2d');
	}

	function startCanvasLoop() {
		const drawFrame = () => {
			if (!canvasCtx || !videoPreview || !isRecording) {
				if (isRecording) {
					animationFrameId = requestAnimationFrame(drawFrame);
				}
				return;
			}

			// Draw video frame
			try {
				canvasCtx.drawImage(videoPreview, 0, 0, canvasRef!.width, canvasRef!.height);
			} catch (e) {
				animationFrameId = requestAnimationFrame(drawFrame);
				return;
			}

			// Draw webcam PIP if enabled
			if (settings.includeWebcam && webcamPreview && ctx.getWebcamStream()) {
				drawWebcamPIP();
			}

			// Draw annotation layer
			if (annotationCanvas && annotationCanvas.width > 0 && annotationCanvas.height > 0) {
				canvasCtx.drawImage(annotationCanvas, 0, 0);
			}

			animationFrameId = requestAnimationFrame(drawFrame);
		};

		animationFrameId = requestAnimationFrame(drawFrame);
	}

	function stopCanvasLoop() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	function drawWebcamPIP() {
		if (!canvasCtx || !webcamPreview || !canvasRef) return;

		const pip = getWebcamPIPRect();
		canvasCtx.save();

		// Draw shadow/border
		canvasCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
		canvasCtx.shadowBlur = 10;
		canvasCtx.fillStyle = '#000';

		if (settings.webcamShape === 'circle') {
			const radius = Math.min(pip.width, pip.height) / 2;
			const centerX = pip.x + pip.width / 2;
			const centerY = pip.y + pip.height / 2;

			canvasCtx.beginPath();
			canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			canvasCtx.clip();
			canvasCtx.drawImage(webcamPreview, pip.x, pip.y, pip.width, pip.height);
		} else {
			canvasCtx.fillRect(pip.x - 2, pip.y - 2, pip.width + 4, pip.height + 4);
			canvasCtx.drawImage(webcamPreview, pip.x, pip.y, pip.width, pip.height);
		}

		canvasCtx.restore();
	}

	function getWebcamPIPRect(): { x: number; y: number; width: number; height: number } {
		if (!canvasRef) return { x: 0, y: 0, width: 0, height: 0 };

		const sizeMultipliers = { small: 0.15, medium: 0.2, large: 0.3 };
		const multiplier = sizeMultipliers[settings.webcamSize];
		const pipWidth = canvasRef.width * multiplier;
		const pipHeight = (pipWidth * 3) / 4;
		const padding = 20;

		let x = padding,
			y = padding;

		switch (settings.webcamPosition) {
			case 'top-right':
				x = canvasRef.width - pipWidth - padding;
				break;
			case 'bottom-left':
				y = canvasRef.height - pipHeight - padding;
				break;
			case 'bottom-right':
				x = canvasRef.width - pipWidth - padding;
				y = canvasRef.height - pipHeight - padding;
				break;
			case 'center':
				x = (canvasRef.width - pipWidth) / 2;
				y = (canvasRef.height - pipHeight) / 2;
				break;
		}

		return { x, y, width: pipWidth, height: pipHeight };
	}

	// ============= Recording Flow =============
	async function handleStartRecording() {
		const success = await ctx.startRecording();
		if (success) {
			// Setup video preview
			const stream = ctx.getStream();
			if (stream && videoPreview) {
				videoPreview.srcObject = stream;
				videoPreview.play();
			}

			// Setup webcam preview
			const webcamStream = ctx.getWebcamStream();
			if (webcamStream && webcamPreview) {
				webcamPreview.srcObject = webcamStream;
				webcamPreview.play();
			}

			// Initialize and start canvas loop
			initCanvas();
			if (canvasRef && stream) {
				const videoTrack = stream.getVideoTracks()[0];
				const trackSettings = videoTrack.getSettings();
				canvasRef.width = trackSettings.width || 1920;
				canvasRef.height = trackSettings.height || 1080;
				if (annotationCanvas) {
					annotationCanvas.width = canvasRef.width;
					annotationCanvas.height = canvasRef.height;
				}
			}
			startCanvasLoop();
		} else {
			toast.error('Failed to start recording');
		}
	}

	function handleSaveVideo(metadata: any) {
		ctx.showPreviewModal = false;
		onUploadComplete?.({
			videoUrl: recordedVideoUrl,
			thumbnailUrl: thumbnail,
			metadata
		});
	}

	function handleDiscard() {
		ctx.reset();
	}

	function handleReRecord() {
		ctx.reset();
		handleStartRecording();
	}

	function formatTime(seconds: number): string {
		return ctx.formatTime(seconds);
	}

	// ============= Annotation Handlers =============
	function getMousePos(e: MouseEvent) {
		if (!canvasRef) return { x: 0, y: 0 };
		const rect = canvasRef.getBoundingClientRect();
		const scaleX = canvasRef.width / rect.width;
		const scaleY = canvasRef.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY
		};
	}

	function handleMouseDown(e: MouseEvent) {
		if (!annotationCtx || !isRecording) return;
		isDrawing = true;
		const pos = getMousePos(e);
		annotationCtx.beginPath();
		annotationCtx.moveTo(pos.x, pos.y);
		annotationCtx.strokeStyle = currentTool.color;
		annotationCtx.lineWidth = currentTool.strokeWidth;
		annotationCtx.lineCap = 'round';
		annotationCtx.lineJoin = 'round';
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDrawing || !annotationCtx) return;
		const pos = getMousePos(e);
		annotationCtx.lineTo(pos.x, pos.y);
		annotationCtx.stroke();
	}

	function handleMouseUp() {
		if (isDrawing && annotationCanvas && annotationCtx) {
			isDrawing = false;
			// Save to history
			const imageData = annotationCtx.getImageData(
				0,
				0,
				annotationCanvas.width,
				annotationCanvas.height
			);
			annotationHistory = [...annotationHistory.slice(0, historyIndex + 1), imageData];
			historyIndex = annotationHistory.length - 1;
		}
	}

	function handleUndo() {
		if (historyIndex > 0 && annotationCtx && annotationCanvas) {
			historyIndex--;
			annotationCtx.putImageData(annotationHistory[historyIndex], 0, 0);
		} else if (historyIndex === 0 && annotationCtx && annotationCanvas) {
			historyIndex = -1;
			annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
		}
	}

	function handleRedo() {
		if (historyIndex < annotationHistory.length - 1 && annotationCtx) {
			historyIndex++;
			annotationCtx.putImageData(annotationHistory[historyIndex], 0, 0);
		}
	}

	function handleClear() {
		if (annotationCtx && annotationCanvas) {
			annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
			annotationHistory = [];
			historyIndex = -1;
		}
	}
</script>

<Card>
	<CardContent class="space-y-4 p-6">
		<!-- Recording Preview -->
		<div class="relative aspect-video bg-muted rounded-lg overflow-hidden group">
			{#if countdown > 0}
				<div class="absolute inset-0 flex items-center justify-center bg-black/80">
					<span class="text-8xl font-bold text-white animate-pulse">{countdown}</span>
				</div>
			{:else if isRecording || isPaused}
				<!-- Main canvas (what gets recorded) -->
				<canvas
					bind:this={canvasRef}
					class="absolute inset-0 w-full h-full cursor-crosshair z-10"
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					onmouseleave={handleMouseUp}
				></canvas>

				<!-- Annotation Toolbar -->
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

				<!-- Recording Timer -->
				<div
					class="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg z-20"
				>
					<div
						class="h-3 w-3 rounded-full {isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}"
					></div>
					<span class="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
					<span class="text-white/60 text-xs">/ {formatTime(settings.maxDuration)}</span>
				</div>

				<!-- Webcam Controls Overlay -->
				{#if settings.includeWebcam}
					<div class="absolute top-4 right-4 flex flex-col gap-2 z-20">
						<!-- Position Controls -->
						<div class="bg-black/70 backdrop-blur-sm rounded-lg p-2 space-y-1">
							<span class="text-white/60 text-xs block text-center">Position</span>
							<div class="grid grid-cols-3 gap-0.5">
								{#each ['top-left', 'center', 'top-right', 'bottom-left', '', 'bottom-right'] as pos, i}
									{#if pos}
										<button
											class="w-6 h-6 rounded text-white/60 hover:bg-white/20 text-xs {settings.webcamPosition ===
											pos
												? 'bg-primary text-white'
												: ''}"
											onclick={() => ctx.setWebcamPosition(pos as WebcamPosition)}
										>
											{['↖', '○', '↗', '↙', '', '↘'][i]}
										</button>
									{:else}
										<div class="w-6 h-6"></div>
									{/if}
								{/each}
							</div>
						</div>

						<!-- Size Controls -->
						<div class="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex items-center gap-1">
							{#each ['small', 'medium', 'large'] as size}
								<button
									class="w-6 h-6 rounded text-white/60 hover:bg-white/20 text-sm {settings.webcamSize ===
									size
										? 'bg-primary/50'
										: ''}"
									onclick={() => ctx.setWebcamSize(size as WebcamSize)}
									>{size[0].toUpperCase()}</button
								>
							{/each}
						</div>

						<!-- Shape Toggle -->
						<button
							class="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 text-white/80 text-xs hover:bg-black/80 flex items-center justify-center gap-1"
							onclick={() => ctx.toggleWebcamShape()}
						>
							{#if settings.webcamShape === 'rectangle'}
								<span class="w-3 h-2 border border-current rounded-sm"></span>
							{:else}
								<span class="w-3 h-3 border border-current rounded-full"></span>
							{/if}
							<span>{settings.webcamShape}</span>
						</button>
					</div>
				{/if}

				{#if isPaused}
					<div class="absolute inset-0 flex items-center justify-center bg-black/40">
						<Badge variant="secondary" class="text-lg px-4 py-2">Paused</Badge>
					</div>
				{/if}
			{:else if videoBlob}
				<video src={recordedVideoUrl} class="w-full h-full object-contain" controls>
					<track kind="captions" />
				</video>
			{:else}
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<Monitor class="h-16 w-16 text-muted-foreground mb-4" />
					<p class="text-sm text-muted-foreground">Select recording source and click start</p>
					{#if !supportsScreenCapture}
						<Badge variant="secondary" class="mt-2">Screen recording unavailable</Badge>
					{/if}
				</div>
			{/if}

			<!-- Hidden video elements -->
			<video bind:this={videoPreview} class="hidden" muted playsinline
				><track kind="captions" /></video
			>
			<video bind:this={webcamPreview} class="hidden" muted playsinline
				><track kind="captions" /></video
			>
		</div>

		<!-- Settings Panel -->
		{#if !isRecording && !videoBlob}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Include Webcam</Label>
						<p class="text-sm text-muted-foreground">Show picture-in-picture</p>
					</div>
					<Switch
						checked={settings.includeWebcam}
						onCheckedChange={(v) => ctx.updateSettings({ includeWebcam: v })}
					/>
				</div>

				{#if settings.includeWebcam}
					<div class="ml-4 space-y-3 pt-2 border-l-2 border-muted pl-4">
						<div class="space-y-2">
							<Label class="text-sm">Position</Label>
							<Select
								type="single"
								value={settings.webcamPosition}
								onValueChange={(v) => ctx.setWebcamPosition(v as WebcamPosition)}
							>
								<SelectTrigger class="h-8">{settings.webcamPosition}</SelectTrigger>
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
							<Select
								type="single"
								value={settings.webcamSize}
								onValueChange={(v) => ctx.setWebcamSize(v as WebcamSize)}
							>
								<SelectTrigger class="h-8">{settings.webcamSize}</SelectTrigger>
								<SelectContent>
									<SelectItem value="small">Small (15%)</SelectItem>
									<SelectItem value="medium">Medium (20%)</SelectItem>
									<SelectItem value="large">Large (30%)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div class="space-y-2">
							<Label class="text-sm">Shape</Label>
							<Select
								type="single"
								value={settings.webcamShape}
								onValueChange={(v) => ctx.updateSettings({ webcamShape: v as WebcamShape })}
							>
								<SelectTrigger class="h-8">{settings.webcamShape}</SelectTrigger>
								<SelectContent>
									<SelectItem value="rectangle">Rectangle</SelectItem>
									<SelectItem value="circle">Circle</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>System Audio</Label>
						<p class="text-sm text-muted-foreground">Record computer audio</p>
					</div>
					<Switch
						checked={settings.includeSystemAudio}
						onCheckedChange={(v) => ctx.updateSettings({ includeSystemAudio: v })}
					/>
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Microphone</Label>
						<p class="text-sm text-muted-foreground">Record voice</p>
					</div>
					<Switch
						checked={settings.includeMicAudio}
						onCheckedChange={(v) => ctx.updateSettings({ includeMicAudio: v })}
					/>
				</div>
			</div>
		{/if}

		<!-- Controls -->
		<div class="flex items-center justify-center gap-2">
			{#if !isRecording && !videoBlob && countdown === 0}
				<Button onclick={handleStartRecording} size="lg" class="gap-2">
					<Circle class="h-5 w-5" />
					Start Recording
				</Button>
				<Popover>
					<PopoverTrigger>
						{#snippet child(props)}
							<Button {...props} variant="ghost" size="icon" title="Keyboard Shortcuts">
								<Keyboard class="h-4 w-4" />
							</Button>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-72">
						<div class="space-y-3">
							<h4 class="font-semibold text-sm">Keyboard Shortcuts</h4>
							<div class="grid grid-cols-2 gap-y-1 text-xs">
								<span class="text-muted-foreground">Start Recording</span>
								<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">R</kbd>
								<span class="text-muted-foreground">Stop Recording</span>
								<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">S</kbd>
								<span class="text-muted-foreground">Pause/Resume</span>
								<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">Space</kbd>
								<span class="text-muted-foreground">Cancel</span>
								<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">Esc</kbd>
							</div>
							{#if settings.includeWebcam}
								<div class="border-t pt-2">
									<h5 class="font-medium text-xs mb-1">Webcam Controls</h5>
									<div class="grid grid-cols-2 gap-y-1 text-xs">
										<span class="text-muted-foreground">Move Position</span>
										<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">↑↓←→</kbd>
										<span class="text-muted-foreground">Cycle Size</span>
										<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">+</kbd>
										<span class="text-muted-foreground">Toggle Shape</span>
										<kbd class="bg-muted px-1.5 py-0.5 rounded text-right">C</kbd>
									</div>
								</div>
							{/if}
						</div>
					</PopoverContent>
				</Popover>
			{:else if countdown > 0}
				<Button onclick={() => ctx.cancelRecording()} size="lg" variant="outline">Cancel</Button>
			{:else if isRecording}
				<Button onclick={() => ctx.togglePause()} size="lg" variant="secondary" class="gap-2">
					{#if isPaused}
						<Play class="h-5 w-5" />
						Resume
					{:else}
						<Pause class="h-5 w-5" />
						Pause
					{/if}
				</Button>
				<Button onclick={() => ctx.stopRecording()} size="lg" variant="destructive" class="gap-2">
					<Square class="h-5 w-5" />
					Stop
				</Button>
			{:else if videoBlob}
				<Button variant="outline" onclick={() => ctx.reset()}>Record Again</Button>
				<Button onclick={() => (ctx.showPreviewModal = true)}>Use This Recording</Button>
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
		bind:open={ctx.showPreviewModal}
		videoUrl={recordedVideoUrl}
		{reviewId}
		onSave={handleSaveVideo}
		onReRecord={handleReRecord}
		onDiscard={handleDiscard}
	/>
{/if}
