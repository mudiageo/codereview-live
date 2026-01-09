<script lang="ts">
	import { getRecordingContext } from '$lib/contexts/recording-context.svelte';
	import { onMount, onDestroy } from 'svelte';
	import AnnotationToolbar from './annotation-toolbar.svelte';

	const ctx = getRecordingContext();

	let canvasRef = $state<HTMLCanvasElement>();
	let animationFrameId: number;

	function updateCanvasLoop() {
		if (!canvasRef || !ctx || !ctx.isRecording) {
			if (ctx?.isRecording) {
				animationFrameId = requestAnimationFrame(updateCanvasLoop);
			}
			return;
		}

		const annotationCanvas = ctx.getAnnotationCanvas();
		const uiCtx = canvasRef.getContext('2d');

		if (annotationCanvas && uiCtx) {
			// Sync resolution
			if (
				canvasRef.width !== annotationCanvas.width ||
				canvasRef.height !== annotationCanvas.height
			) {
				canvasRef.width = annotationCanvas.width;
				canvasRef.height = annotationCanvas.height;
			}

			uiCtx.clearRect(0, 0, canvasRef.width, canvasRef.height);
			uiCtx.drawImage(annotationCanvas, 0, 0, canvasRef.width, canvasRef.height);
		}

		animationFrameId = requestAnimationFrame(updateCanvasLoop);
	}

	onMount(() => {
		animationFrameId = requestAnimationFrame(updateCanvasLoop);
	});

	onDestroy(() => {
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
	});

	// Events
	function onMouseDown(e: MouseEvent) {
		if (ctx && ctx.isAnnotationMode) {
			// We need to pass the canvasRef so getMousePos can calculate scaling
			// But ctx.handleMouseDown expects to use ctx.canvasRef (which is media-recorder's canvas)
			// or we need to overload/update it?

			// User updated getMousePos to take 'canvas' arg.
			// But handleMouseDown uses 'this.canvasRef'.

			// I should stick to calling ctx methods, but context methods use `this.canvasRef` (the UI canvas).
			// When specific UI canvas (media-recorder) is unmounted, `this.canvasRef` is null!

			// So ctx.handleMouseDown needs to be robust or accept a canvas arg.
			// User's edit:
			// handleMouseDown(e) { if (!this.canvasRef) return; const pos = this.getMousePos(e, this.canvasRef); ... }

			// PROBLEM: When GlobalAnnotationLayer is active, MediaRecorder might be unmounted, so ctx.canvasRef is NULL.
			// WE NEED TO FIX THIS in RecordingContext.

			// For now, I'll temporarily override/hack or ideally fix RecordingContext to accept canvas ref for input?
			// Or better: RecordingContext should assume 'canvasRef' is the *active input canvas*.

			// So GlobalAnnotationLayer should call ctx.setCanvasRef(canvasRef) on mount?
			// Yes! That makes it the active recording UI.

			// But wait, setCanvasRef sets 'uiCtx' which is used for the Preview Loop.
			// If I set it to GlobalAnnotationLayer's canvas, the context will try to draw the VIDEO PREVIEW on my transparent overlay!
			// I don't want video preview on GlobalAnnotationLayer (it covers the screen).
			// I only want ANNOTATIONS.

			// So: GlobalAnnotationLayer should NOT use setCanvasRef.
			// But it needs to handle input.

			// I should manually handle input here and call internal context drawing methods?
			// Or update RecordingContext to separate "VideoOutputCanvas" from "InputCanvas"?

			// User's handleMouseDown uses `this.canvasRef`. I should treat that as "Current Interaction Canvas".
			// But `startCanvasLoop` uses `this.canvasRef` to draw the FULL COMPOSITE (Video + PIP + Annotations).

			// If I setCanvasRef to global layer, I get the full video blocking the screen. Bad.

			// Workaround: Duplicate input logic here, or modify RecordingContext to accept (e, canvas) for handlers.

			// I'll call a modified handler or duplicate the logic for now to be safe and avoid breaking the user's specific edit structure if possible.
			// Actually, I can just call properties directly since public.

			const annotationCtx = ctx.getAnnotationContext();
			if (!annotationCtx) return;

			ctx.isDrawing = true;
			// Calculate pos manually using OUR canvas
			const rect = canvasRef.getBoundingClientRect();
			const scaleX = canvasRef.width / rect.width;
			const scaleY = canvasRef.height / rect.height;
			const x = (e.clientX - rect.left) * scaleX;
			const y = (e.clientY - rect.top) * scaleY;

			annotationCtx.beginPath();
			annotationCtx.moveTo(x, y);
			annotationCtx.strokeStyle = ctx.currentTool.color;
			annotationCtx.lineWidth = ctx.currentTool.strokeWidth;
			annotationCtx.lineCap = 'round';
			annotationCtx.lineJoin = 'round';
		}
	}

	function onMouseMove(e: MouseEvent) {
		if (ctx && ctx.isDrawing && ctx.isAnnotationMode && canvasRef) {
			const annotationCtx = ctx.getAnnotationContext();
			if (!annotationCtx) return;

			const rect = canvasRef.getBoundingClientRect();
			const scaleX = canvasRef.width / rect.width;
			const scaleY = canvasRef.height / rect.height;
			const x = (e.clientX - rect.left) * scaleX;
			const y = (e.clientY - rect.top) * scaleY;

			annotationCtx.lineTo(x, y);
			annotationCtx.stroke();
		}
	}

	function onMouseUp() {
		if (ctx) ctx.handleMouseUp(); // This just pushes history, universal
	}
</script>

{#if ctx && ctx.isRecording}
	<!-- Overlay Container -->
	<div
		class="fixed inset-0 z-[100] pointer-events-none"
		class:pointer-events-auto={ctx.isAnnotationMode}
	>
		<!-- Canvas for viewing/drawing annotations -->
		<!-- Only visible if we have content or are drawing? Always visible so we see annotations made elsewhere? Yes. -->
		<canvas
			bind:this={canvasRef}
			class="w-full h-full"
			onmousedown={onMouseDown}
			onmousemove={onMouseMove}
			onmouseup={onMouseUp}
			onmouseleave={onMouseUp}
		></canvas>

		<!-- Toolbar for global mode (if enabled) -->
		{#if ctx.isAnnotationMode}
			<div class="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
				<AnnotationToolbar
					currentTool={ctx.currentTool}
					visible={true}
					canUndo={ctx.historyIndex > 0 ||
						(ctx.historyIndex === 0 && ctx.annotationHistory.length > 0)}
					canRedo={ctx.historyIndex < ctx.annotationHistory.length - 1}
					onUndo={() => ctx.undoAnnotation()}
					onRedo={() => ctx.redoAnnotation()}
					onClear={() => ctx.clearAnnotations()}
					onToolChange={(tool) => ctx.setTool(tool)}
					onToggleVisibility={() => {}}
				/>
			</div>

			<!-- Close Button -->
			<div class="absolute top-8 right-8 pointer-events-auto">
				<button
					class="bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/70 backdrop-blur"
					onclick={() => (ctx.isAnnotationMode = false)}
				>
					Exit Annotation Mode
				</button>
			</div>
		{/if}
	</div>
{/if}
