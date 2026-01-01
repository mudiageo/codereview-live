<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Square from '@lucide/svelte/icons/square';
	import Minimize2 from '@lucide/svelte/icons/minimize-2';
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import Move from '@lucide/svelte/icons/move';

	interface Props {
		isRecording: boolean;
		isPaused: boolean;
		recordingTime: number;
		position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
		showPreview?: boolean;
		videoStream?: MediaStream | null;
		onPause?: () => void;
		onResume?: () => void;
		onStop?: () => void;
		onGoToRecorder?: () => void;
	}

	let {
		isRecording,
		isPaused,
		recordingTime,
		position = 'bottom-right',
		showPreview = false,
		videoStream = null,
		onPause,
		onResume,
		onStop,
		onGoToRecorder
	}: Props = $props();

	let isMinimized = $state(false);
	let previewRef = $state<HTMLVideoElement>();

	// Set up video preview when stream is available
	$effect(() => {
		if (previewRef && videoStream) {
			previewRef.srcObject = videoStream;
			previewRef.play().catch(() => {});
		}
	});

	function formatTime(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	const positionClasses: Record<string, string> = {
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-right': 'top-20 right-4',
		'top-left': 'top-20 left-4'
	};
</script>

{#if isRecording}
	<div
		class="fixed {positionClasses[
			position
		]} z-50 flex flex-col gap-2 transition-all duration-300 ease-in-out"
	>
		<!-- Main Toolbar -->
		<div
			class="bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden"
			class:w-auto={isMinimized}
		>
			<!-- Video Preview (optional, collapsible) -->
			{#if showPreview && videoStream && !isMinimized}
				<div class="relative w-48 h-28 bg-black">
					<video bind:this={previewRef} class="w-full h-full object-cover" muted playsinline>
						<track kind="captions" />
					</video>
					<div class="absolute top-1 right-1">
						<button
							class="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
							onclick={() => (isMinimized = true)}
							title="Minimize"
						>
							<Minimize2 class="h-3 w-3 text-white" />
						</button>
					</div>
				</div>
			{/if}

			<!-- Controls Bar -->
			<div class="flex items-center gap-2 p-2.5">
				<!-- Recording Indicator -->
				<div class="flex items-center gap-2">
					<span class="relative flex h-2.5 w-2.5">
						<span
							class="absolute inline-flex h-full w-full rounded-full opacity-75 {isPaused
								? 'bg-yellow-400'
								: 'bg-red-500 animate-ping'}"
						></span>
						<span
							class="relative inline-flex rounded-full h-2.5 w-2.5 {isPaused
								? 'bg-yellow-400'
								: 'bg-red-500'}"
						></span>
					</span>
					<span class="font-mono text-white text-sm font-medium min-w-[52px]">
						{formatTime(recordingTime)}
					</span>
					{#if isPaused}
						<Badge variant="secondary" class="text-xs py-0 px-1.5">PAUSED</Badge>
					{/if}
				</div>

				<!-- Divider -->
				<div class="w-px h-5 bg-gray-600"></div>

				<!-- Control Buttons -->
				<div class="flex items-center gap-1">
					<Button
						size="sm"
						variant="ghost"
						class="h-7 w-7 p-0 text-white hover:bg-white/20"
						onclick={() => (isPaused ? onResume?.() : onPause?.())}
						title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
					>
						{#if isPaused}
							<Play class="h-4 w-4" />
						{:else}
							<Pause class="h-4 w-4" />
						{/if}
					</Button>
					<Button
						size="sm"
						variant="ghost"
						class="h-7 w-7 p-0 text-white hover:bg-red-500/50"
						onclick={onStop}
						title="Stop (S)"
					>
						<Square class="h-4 w-4" />
					</Button>
				</div>

				<!-- Divider -->
				<div class="w-px h-5 bg-gray-600"></div>

				<!-- Navigate to Recorder -->
				<Button
					size="sm"
					variant="ghost"
					class="h-7 px-2 text-white hover:bg-white/20 text-xs gap-1"
					onclick={onGoToRecorder}
					title="Go to Recording"
				>
					<Move class="h-3.5 w-3.5" />
					<span>View</span>
				</Button>

				<!-- Expand/Minimize -->
				{#if showPreview && videoStream}
					<button
						class="p-1.5 hover:bg-white/20 rounded transition-colors"
						onclick={() => (isMinimized = !isMinimized)}
						title={isMinimized ? 'Show preview' : 'Hide preview'}
					>
						{#if isMinimized}
							<Maximize2 class="h-3.5 w-3.5 text-white" />
						{:else}
							<Minimize2 class="h-3.5 w-3.5 text-white" />
						{/if}
					</button>
				{/if}
			</div>
		</div>

		<!-- Keyboard Hints (subtle) -->
		<div class="text-xs text-gray-400 text-center opacity-60">
			Press <kbd class="bg-gray-700 px-1 rounded">S</kbd> to stop
		</div>
	</div>
{/if}
