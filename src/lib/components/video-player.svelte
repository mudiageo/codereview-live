<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Maximize from '@lucide/svelte/icons/maximize';
	import PictureInPicture from '@lucide/svelte/icons/picture-in-picture';
	import Settings from '@lucide/svelte/icons/settings';
	import { settingsStore } from '$lib/stores/index.svelte';
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		onTimeUpdate?: (time: number) => void;
		markers?: Array<{ time: number; label?: string }>;
		autoplay?: boolean;
	}

	let { src, onTimeUpdate, markers = [], autoplay }: Props = $props();

	let videoElement = $state<HTMLVideoElement>();
	let isPlaying = $state(false);
	let isMuted = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state([100]);
	let playbackRate = $state(1);
	let showControls = $state(true);
	let controlsTimeout: number;
	let isPiP = $state(false);

	// Apply default playback speed from settings on mount
	onMount(() => {
		if (videoElement) {
			playbackRate = settingsStore.settings.defaultSpeed;
			videoElement.playbackRate = playbackRate;

			// Handle autoplay from settings
			const shouldAutoplay = autoplay ?? settingsStore.settings.autoplay;
			if (shouldAutoplay) {
				videoElement.play().catch(() => {
					// Autoplay was prevented, user interaction required
				});
			}

			videoElement.addEventListener('enterpictureinpicture', () => (isPiP = true));
			videoElement.addEventListener('leavepictureinpicture', () => (isPiP = false));
		}
	});

	function togglePlay() {
		if (!videoElement) return;

		if (isPlaying) {
			videoElement.pause();
		} else {
			videoElement.play();
		}
		isPlaying = !isPlaying;
	}

	function toggleMute() {
		if (!videoElement) return;
		videoElement.muted = !isMuted;
		isMuted = !isMuted;
	}

	function toggleFullscreen() {
		if (!videoElement) return;
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			videoElement.requestFullscreen();
		}
	}

	async function togglePiP() {
		if (!videoElement) return;
		try {
			if (document.pictureInPictureElement) {
				await document.exitPictureInPicture();
			} else {
				await videoElement.requestPictureInPicture();
			}
		} catch (err) {
			console.error('Failed to toggle PiP:', err);
		}
	}

	function handleTimeUpdate() {
		if (!videoElement) return;
		currentTime = videoElement.currentTime;
		onTimeUpdate?.(currentTime);
	}

	function handleLoadedMetadata() {
		if (!videoElement) return;
		const d = videoElement.duration;

		// WebM videos recorded with MediaRecorder often have Infinity duration
		// because the browser doesn't write duration metadata correctly.
		// Workaround: seek to the end to force the browser to calculate the real duration
		if (!Number.isFinite(d)) {
			// Save current time
			const currentPos = videoElement.currentTime;

			// Seek to a very large time - browser will clamp to actual duration
			videoElement.currentTime = Number.MAX_SAFE_INTEGER;

			// Wait for the seek to complete, then get the real duration
			videoElement.onseeked = () => {
				duration = videoElement!.duration;
				// Seek back to original position
				videoElement!.currentTime = currentPos;
				videoElement!.onseeked = null;
			};
		} else {
			duration = d;
		}
	}

	function seekTo(time: number) {
		if (!videoElement) return;
		videoElement.currentTime = time;
		currentTime = time;
	}

	function handleVolumeChange(value: number[]) {
		if (!videoElement) return;
		videoElement.volume = value[0] / 100;
		volume = value;
	}

	function formatTime(seconds: number) {
		if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handleMouseMove() {
		showControls = true;
		clearTimeout(controlsTimeout);
		controlsTimeout = window.setTimeout(() => {
			if (isPlaying) showControls = false;
		}, 3000);
	}
</script>

<div
	class="relative bg-black rounded-lg overflow-hidden group"
	onmousemove={handleMouseMove}
	onmouseleave={() => isPlaying && (showControls = false)}
>
	<video
		bind:this={videoElement}
		{src}
		class="w-full aspect-video"
		ontimeupdate={handleTimeUpdate}
		onloadedmetadata={handleLoadedMetadata}
		onclick={togglePlay}
	>
		<track kind="captions" />
	</video>

	<!-- Controls -->
	<div
		class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300"
		class:opacity-0={!showControls}
		class:opacity-100={showControls}
	>
		<!-- Progress Bar -->
		<div class="space-y-2 mb-3">
			<div class="relative h-1 bg-white/20 rounded-full cursor-pointer">
				<div
					class="absolute h-full bg-primary rounded-full"
					style="width: {(currentTime / duration) * 100}%"
				></div>

				<!-- Markers -->
				{#each markers as marker}
					<button
						type="button"
						class="absolute -top-1 w-3 h-3 bg-chart-2 rounded-full border-2 border-black"
						style="left: {(marker.time / duration) * 100}%"
						onclick={() => seekTo(marker.time)}
						title={marker.label}
					></button>
				{/each}
			</div>
		</div>

		<!-- Controls Row -->
		<div class="flex items-center justify-between text-white">
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-white hover:bg-white/20"
					onclick={togglePlay}
				>
					{#if isPlaying}
						<Pause class="h-4 w-4" />
					{:else}
						<Play class="h-4 w-4" />
					{/if}
				</Button>

				<div class="flex items-center gap-2 group/volume">
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 text-white hover:bg-white/20"
						onclick={toggleMute}
					>
						{#if isMuted}
							<VolumeX class="h-4 w-4" />
						{:else}
							<Volume2 class="h-4 w-4" />
						{/if}
					</Button>
					<div class="w-0 overflow-hidden group-hover/volume:w-20 transition-all">
						<Slider
							bind:value={volume}
							max={100}
							step={1}
							onValueChange={handleVolumeChange}
							class="w-20"
						/>
					</div>
				</div>

				<span class="text-xs font-mono">
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>
			</div>

			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					class="h-7 text-xs text-white hover:bg-white/20"
					onclick={() => (playbackRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
				>
					{playbackRate}x
				</Button>

				<Button variant="ghost" size="icon" class="h-8 w-8 text-white hover:bg-white/20">
					<Settings class="h-4 w-4" />
				</Button>

				{#if 'pictureInPictureEnabled' in document}
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 text-white hover:bg-white/20"
						onclick={togglePiP}
						title="Picture in Picture"
					>
						<PictureInPicture class="h-4 w-4" />
					</Button>
				{/if}

				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-white hover:bg-white/20"
					onclick={toggleFullscreen}
				>
					<Maximize class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>
