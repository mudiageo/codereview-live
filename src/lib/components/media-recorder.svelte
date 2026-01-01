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
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import Monitor from '@lucide/svelte/icons/monitor';
	import {
		getRecordingContext,
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

	// Element refs - passed to context
	let canvasRef = $state<HTMLCanvasElement>();
	let videoPreviewRef = $state<HTMLVideoElement>();
	let webcamPreviewRef = $state<HTMLVideoElement>();

	// Annotation UI state now managed by RecordingContext

	// Screen capture support check
	const supportsScreenCapture =
		typeof navigator !== 'undefined' &&
		'mediaDevices' in navigator &&
		'getDisplayMedia' in navigator.mediaDevices;

	// Pass refs to context when they're available
	$effect(() => {
		if (canvasRef) ctx.setCanvasRef(canvasRef);
	});

	$effect(() => {
		if (videoPreviewRef) ctx.setVideoPreviewRef(videoPreviewRef);
	});

	$effect(() => {
		if (webcamPreviewRef) ctx.setWebcamPreviewRef(webcamPreviewRef);
	});

	// ============= Keyboard Shortcuts =============
	// Keyboard handling delegated to context
	function bgHandleKeyDown(e: KeyboardEvent) {
		ctx.handleKeyDown(e);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', bgHandleKeyDown);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', bgHandleKeyDown);
		}
	});

	// ============= Annotation Mouse Handlers =============
	// Annotation handlers delegated to context
	function onMouseDown(e: MouseEvent) {
		ctx.handleMouseDown(e);
	}

	function onMouseMove(e: MouseEvent) {
		ctx.handleMouseMove(e);
	}

	function onMouseUp() {
		ctx.handleMouseUp();
	}

	function handleUndo() {
		ctx.undoAnnotation();
	}

	function handleRedo() {
		ctx.redoAnnotation();
	}

	function handleClear() {
		ctx.clearAnnotations();
	}

	function handleSaveVideo(metadata: any) {
		ctx.showPreviewModal = false;
		onUploadComplete?.({
			videoUrl: ctx.recordedVideoUrl,
			thumbnailUrl: ctx.thumbnail,
			metadata
		});
	}
</script>

<Card>
	<CardContent class="space-y-4 p-6">
		<!-- Recording Preview -->
		<div class="relative aspect-video bg-muted rounded-lg overflow-hidden group">
			{#if ctx.countdown > 0}
				<div class="absolute inset-0 flex items-center justify-center bg-black/80">
					<span class="text-8xl font-bold text-white animate-pulse">{ctx.countdown}</span>
				</div>
			{:else if ctx.isRecording || ctx.isPaused}
				<!-- Main canvas -->
				<canvas
					bind:this={canvasRef}
					class="absolute inset-0 w-full h-full cursor-crosshair z-10"
					onmousedown={onMouseDown}
					onmousemove={onMouseMove}
					onmouseup={onMouseUp}
					onmouseleave={onMouseUp}
				></canvas>

				<!-- Annotation Toolbar -->
				<div
					class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<AnnotationToolbar
						currentTool={ctx.currentTool}
						visible={true}
						canUndo={ctx.historyIndex > 0 ||
							(ctx.historyIndex === 0 && ctx.annotationHistory.length > 0)}
						canRedo={ctx.historyIndex < ctx.annotationHistory.length - 1}
						onUndo={handleUndo}
						onRedo={handleRedo}
						onClear={handleClear}
						onToolChange={(tool) => ctx.setTool(tool)}
						onToggleVisibility={() => {}}
					/>
				</div>

				<!-- Recording Timer -->
				<div
					class="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg z-20"
				>
					<div
						class="h-3 w-3 rounded-full {ctx.isPaused
							? 'bg-yellow-500'
							: 'bg-red-500 animate-pulse'}"
					></div>
					<span class="text-white font-mono text-sm">{ctx.formatTime(ctx.recordingTime)}</span>
					<span class="text-white/60 text-xs">/ {ctx.formatTime(ctx.settings.maxDuration)}</span>
				</div>

				<!-- Webcam Controls Overlay -->
				{#if ctx.settings.includeWebcam}
					<div class="absolute top-4 right-4 flex flex-col gap-2 z-20">
						<div class="bg-black/70 backdrop-blur-sm rounded-lg p-2 space-y-1">
							<span class="text-white/60 text-xs block text-center">Position</span>
							<div class="grid grid-cols-3 gap-0.5">
								{#each ['top-left', 'center', 'top-right', 'bottom-left', '', 'bottom-right'] as pos, i}
									{#if pos}
										<button
											class="w-6 h-6 rounded text-white/60 hover:bg-white/20 text-xs {ctx.settings
												.webcamPosition === pos
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
						<div class="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex items-center gap-1">
							{#each ['small', 'medium', 'large'] as size}
								<button
									class="w-6 h-6 rounded text-white/60 hover:bg-white/20 text-sm {ctx.settings
										.webcamSize === size
										? 'bg-primary/50'
										: ''}"
									onclick={() => ctx.setWebcamSize(size as WebcamSize)}
									>{size[0].toUpperCase()}</button
								>
							{/each}
						</div>
						<button
							class="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 text-white/80 text-xs hover:bg-black/80 flex items-center justify-center gap-1"
							onclick={() => ctx.toggleWebcamShape()}
						>
							{#if ctx.settings.webcamShape === 'rectangle'}
								<span class="w-3 h-2 border border-current rounded-sm"></span>
							{:else}
								<span class="w-3 h-3 border border-current rounded-full"></span>
							{/if}
							<span>{ctx.settings.webcamShape}</span>
						</button>
					</div>
				{/if}

				{#if ctx.isPaused}
					<div class="absolute inset-0 flex items-center justify-center bg-black/40">
						<Badge variant="secondary" class="text-lg px-4 py-2">Paused</Badge>
					</div>
				{/if}
			{:else if ctx.videoBlob}
				<video src={ctx.recordedVideoUrl} class="w-full h-full object-contain" controls>
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

			<!-- Hidden video elements for streams -->
			<video bind:this={videoPreviewRef} class="hidden" muted playsinline
				><track kind="captions" /></video
			>
			<video bind:this={webcamPreviewRef} class="hidden" muted playsinline
				><track kind="captions" /></video
			>
		</div>

		<!-- Settings Panel (only when not recording) -->
		{#if !ctx.isRecording && !ctx.videoBlob}
			<div class="space-y-4">
				<!-- Recording Source Selector -->
				<div class="space-y-2">
					<Label>Recording Source</Label>
					<Select
						type="single"
						value={ctx.settings.selectedSource}
						onValueChange={(v) => ctx.updateSettings({ selectedSource: v as 'workspace' | 'screen' | 'window' })}
					>
						<SelectTrigger>{ctx.settings.selectedSource === 'workspace' ? 'Code Workspace' : ctx.settings.selectedSource === 'screen' ? 'Screen' : 'Window'}</SelectTrigger>
						<SelectContent>
							<SelectItem value="workspace">Code Workspace (Default)</SelectItem>
							{#if supportsScreenCapture}
								<SelectItem value="screen">Screen</SelectItem>
								<SelectItem value="window">Window</SelectItem>
							{/if}
						</SelectContent>
					</Select>
					<p class="text-xs text-muted-foreground">
						{#if ctx.settings.selectedSource === 'workspace'}
							Captures the code editor workspace
						{:else if ctx.settings.selectedSource === 'screen'}
							Captures your entire screen
						{:else}
							Captures a specific window
						{/if}
					</p>
				</div>

				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Include Webcam</Label>
						<p class="text-sm text-muted-foreground">Show picture-in-picture</p>
					</div>
					<Switch
						checked={ctx.settings.includeWebcam}
						onCheckedChange={(v) => ctx.updateSettings({ includeWebcam: v })}
					/>
				</div>

				{#if ctx.settings.includeWebcam}
					<div class="ml-4 space-y-3 pt-2 border-l-2 border-muted pl-4">
						<div class="space-y-2">
							<Label class="text-sm">Position</Label>
							<Select
								type="single"
								value={ctx.settings.webcamPosition}
								onValueChange={(v) => ctx.setWebcamPosition(v as WebcamPosition)}
							>
								<SelectTrigger class="h-8">{ctx.settings.webcamPosition}</SelectTrigger>
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
								value={ctx.settings.webcamSize}
								onValueChange={(v) => ctx.setWebcamSize(v as WebcamSize)}
							>
								<SelectTrigger class="h-8">{ctx.settings.webcamSize}</SelectTrigger>
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
								value={ctx.settings.webcamShape}
								onValueChange={(v) => ctx.updateSettings({ webcamShape: v as WebcamShape })}
							>
								<SelectTrigger class="h-8">{ctx.settings.webcamShape}</SelectTrigger>
								<SelectContent>
									<SelectItem value="rectangle">Rectangle</SelectItem>
									<SelectItem value="circle">Circle</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				{/if}

				<!-- Only show audio options for screen/window capture -->
				{#if ctx.settings.selectedSource === 'screen' || ctx.settings.selectedSource === 'window'}
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label>System Audio</Label>
							<p class="text-sm text-muted-foreground">Record computer audio</p>
						</div>
						<Switch
							checked={ctx.settings.includeSystemAudio}
							onCheckedChange={(v) => ctx.updateSettings({ includeSystemAudio: v })}
						/>
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Microphone</Label>
						<p class="text-sm text-muted-foreground">Record voice</p>
					</div>
					<Switch
						checked={ctx.settings.includeMicAudio}
						onCheckedChange={(v) => ctx.updateSettings({ includeMicAudio: v })}
					/>
				</div>
			</div>
		{/if}

		<!-- Controls -->
		<div class="flex items-center justify-center gap-2">
			{#if !ctx.isRecording && !ctx.videoBlob && ctx.countdown === 0}
				<Button onclick={() => ctx.startRecording()} size="lg" class="gap-2">
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
							{#if ctx.settings.includeWebcam}
								<div class="border-t pt-2">
									<h5 class="font-medium text-xs mb-1">Webcam Controls</h5>
									<div class="grid grid-cols-2 gap-y-1 text-xs">
										<span class="text-muted-foreground">Cycle Position</span>
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
			{:else if ctx.countdown > 0}
				<Button onclick={() => ctx.cancelRecording()} size="lg" variant="outline">Cancel</Button>
			{:else if ctx.isRecording}
				<Button onclick={() => ctx.togglePause()} size="lg" variant="secondary" class="gap-2">
					{#if ctx.isPaused}
						<Play class="h-5 w-5" /> Resume
					{:else}
						<Pause class="h-5 w-5" /> Pause
					{/if}
				</Button>
				<Button onclick={() => ctx.stopRecording()} size="lg" variant="destructive" class="gap-2">
					<Square class="h-5 w-5" /> Stop
				</Button>
			{:else if ctx.videoBlob}
				<Button variant="outline" onclick={() => ctx.reset()}>Record Again</Button>
				<Button onclick={() => (ctx.showPreviewModal = true)}>Use This Recording</Button>
			{/if}
		</div>

		{#if ctx.videoBlob}
			<div class="text-sm text-center text-muted-foreground">
				Duration: {ctx.formatTime(ctx.recordingTime)} • Size: {(
					ctx.videoBlob.size /
					1024 /
					1024
				).toFixed(2)} MB
			</div>
		{/if}
	</CardContent>
</Card>

{#if ctx.showPreviewModal}
	<VideoPreviewModal
		bind:open={ctx.showPreviewModal}
		videoUrl={ctx.recordedVideoUrl}
		{reviewId}
		onSave={handleSaveVideo}
		onReRecord={() => {
			ctx.reset();
			ctx.startRecording();
		}}
		onDiscard={() => ctx.reset()}
	/>
{/if}
