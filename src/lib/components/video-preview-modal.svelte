<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Save from '@lucide/svelte/icons/save';
	import UploadCloud from '@lucide/svelte/icons/upload-cloud';
	import HardDrive from '@lucide/svelte/icons/hard-drive';
	import Cloud from '@lucide/svelte/icons/cloud';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import X from '@lucide/svelte/icons/x';
	import { uploadVideo } from '$lib/video.remote';
	import { settingsStore } from '$lib/stores/index.svelte';
	import {
		createClientVideoStorage,
		cloudSyncQueue,
		formatStorageSize,
		detectAvailableBackends,
		type StorageMode,
		type ClientStorageBackend
	} from '$lib/utils/client-video-storage';

	interface Props {
		open: boolean;
		videoUrl: string;
		reviewId: string;
		onSave: (
			metadata: VideoMetadata & { videoUrl: string; thumbnailUrl: string; metadata: any }
		) => void;
		onReRecord: () => void;
		onDiscard: () => void;
	}

	export interface VideoMetadata {
		title: string;
		description: string;
		trimStart: number;
		trimEnd: number;
	}

	let { open = $bindable(), videoUrl, reviewId, onSave, onReRecord, onDiscard }: Props = $props();

	let videoElement: HTMLVideoElement;
	let title = $state('');
	let description = $state('');
	let trimStart = $state(0);
	let trimEnd = $state(0);
	let videoDuration = $state(0);
	let storageProvider = $state<StorageMode>(settingsStore.settings.storageProvider || 'client');
	let isUploading = $state(false);
	let availableBackends = $state<ClientStorageBackend[]>([]);
	let selectedBackend = $state<'auto' | ClientStorageBackend>(
		settingsStore.settings.clientStorageBackend || 'auto'
	);

	// Detect available storage backends on mount
	$effect(() => {
		detectAvailableBackends().then((backends) => {
			availableBackends = backends;
		});
	});

	function handleVideoLoad() {
		if (videoElement) {
			videoDuration = videoElement.duration;
			trimEnd = videoDuration;
		}
	}

	async function handleSave() {
		if (!reviewId) {
			toast.error('Cannot save video without a review ID');
			return;
		}

		isUploading = true;
		try {
			// Fetch blob from URL
			const response = await fetch(videoUrl);
			const blob = await response.blob();

			// Generate thumbnail
			const thumbnailUrl = await generateThumbnail(blob);

			if (storageProvider === 'client') {
				// Save to client-side storage
				const backend = selectedBackend === 'auto' ? undefined : selectedBackend;
				const storage = await createClientVideoStorage(backend);

				const id = await storage.save(blob, {
					title: title || 'Untitled Recording',
					description,
					reviewId,
					duration: videoDuration,
					mimeType: 'video/webm',
					thumbnailDataUrl: thumbnailUrl
				});

				toast.success(`Video saved to ${storage.getBackend()} storage`);

				onSave({
					title,
					description,
					trimStart,
					trimEnd,
					videoUrl: `client://${id}`,
					thumbnailUrl,
					metadata: {
						storageBackend: storage.getBackend(),
						clientVideoId: id,
						duration: videoDuration
					}
				});

				open = false;
				return;
			}

			if (storageProvider === 'hybrid') {
				// Save locally first, then queue for cloud sync
				const backend = selectedBackend === 'auto' ? undefined : selectedBackend;
				const storage = await createClientVideoStorage(backend);

				const id = await storage.save(blob, {
					title: title || 'Untitled Recording',
					description,
					reviewId,
					duration: videoDuration,
					mimeType: 'video/webm',
					thumbnailDataUrl: thumbnailUrl,
					syncStatus: 'pending'
				});

				// Queue for background cloud sync
				cloudSyncQueue.add(id, reviewId);

				toast.success('Video saved locally. Cloud sync will happen in background.');

				onSave({
					title,
					description,
					trimStart,
					trimEnd,
					videoUrl: `client://${id}`,
					thumbnailUrl,
					metadata: {
						storageBackend: storage.getBackend(),
						clientVideoId: id,
						duration: videoDuration,
						syncStatus: 'pending'
					}
				});

				open = false;
				return;
			}

			// Cloud storage - upload to server
			const file = new File([blob], 'recording.webm', { type: 'video/webm' });

			const result = await uploadVideo({
				video: file,
				reviewId,
				storageProvider: 'cloud'
			});

			if (result.success && result.videoUrl) {
				onSave({
					title,
					description,
					trimStart,
					trimEnd,
					videoUrl: result.videoUrl,
					thumbnailUrl: result.thumbnailUrl || thumbnailUrl,
					metadata: result.metadata
				});
				toast.success('Video uploaded successfully');
				open = false;
			}
		} catch (error: any) {
			console.error('Save failed:', error);
			toast.error(error.message || 'Failed to save video');
		} finally {
			isUploading = false;
		}
	}

	async function generateThumbnail(blob: Blob): Promise<string> {
		return new Promise((resolve) => {
			const video = document.createElement('video');
			video.src = URL.createObjectURL(blob);
			video.muted = true;

			video.addEventListener('loadeddata', () => {
				video.currentTime = Math.min(2, video.duration / 2);
			});

			video.addEventListener('seeked', () => {
				const canvas = document.createElement('canvas');
				canvas.width = 320;
				canvas.height = 180;

				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

				resolve(canvas.toDataURL('image/jpeg', 0.7));
				URL.revokeObjectURL(video.src);
			});
		});
	}

	function handleReRecord() {
		onReRecord();
		open = false;
	}

	function handleDiscard() {
		onDiscard();
		open = false;
	}

	function getStorageModeDescription(mode: StorageMode): string {
		switch (mode) {
			case 'client':
				return 'Video will be stored in your browser. Available offline, but cannot be shared across devices.';
			case 'cloud':
				return 'Video will be uploaded to the configured cloud storage (S3/R2/local server).';
			case 'hybrid':
				return 'Video is saved locally first for instant access, then synced to cloud in the background.';
			default:
				return '';
		}
	}

	function getBackendDisplayName(backend: ClientStorageBackend): string {
		switch (backend) {
			case 'tauri':
				return 'Native Filesystem';
			case 'opfs':
				return 'Origin Private File System';
			case 'filesystem':
				return 'User Filesystem';
			case 'indexeddb':
				return 'Browser Storage (IndexedDB)';
			default:
				return 'Unknown';
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Preview & Save Video</DialogTitle>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Video Preview -->
			<div class="relative bg-black rounded-lg overflow-hidden">
				<video
					bind:this={videoElement}
					src={videoUrl}
					controls
					class="w-full"
					onloadedmetadata={handleVideoLoad}
				/>
			</div>

			<!-- Metadata -->
			<div class="space-y-4">
				<div>
					<Label for="title">Video Title</Label>
					<Input id="title" bind:value={title} placeholder="Enter video title" />
				</div>

				<div>
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						bind:value={description}
						placeholder="Add description (optional)"
						rows={3}
					/>
				</div>

				<!-- Trim Controls (Optional) -->
				{#if videoDuration > 0}
					<div class="space-y-2">
						<Label>Trim Video (Optional)</Label>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="trimStart" class="text-xs">Start (seconds)</Label>
								<Input
									id="trimStart"
									type="number"
									bind:value={trimStart}
									min={0}
									max={videoDuration}
									step={0.1}
								/>
							</div>
							<div>
								<Label for="trimEnd" class="text-xs">End (seconds)</Label>
								<Input
									id="trimEnd"
									type="number"
									bind:value={trimEnd}
									min={0}
									max={videoDuration}
									step={0.1}
								/>
							</div>
						</div>
						<p class="text-xs text-muted-foreground">
							Duration: {(trimEnd - trimStart).toFixed(1)}s / {videoDuration.toFixed(1)}s
						</p>
					</div>
				{/if}

				<!-- Storage Mode Selection -->
				<div class="space-y-3">
					<Label>Storage Mode</Label>
					<Select type="single" bind:value={storageProvider}>
						<SelectTrigger class="w-full">
							<div class="flex items-center gap-2">
								{#if storageProvider === 'client'}
									<HardDrive class="h-4 w-4" />
									<span>Client Storage (Browser)</span>
								{:else if storageProvider === 'cloud'}
									<Cloud class="h-4 w-4" />
									<span>Cloud Storage</span>
								{:else}
									<RefreshCw class="h-4 w-4" />
									<span>Hybrid (Local + Cloud Sync)</span>
								{/if}
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="client">
								<div class="flex items-center gap-2">
									<HardDrive class="h-4 w-4" />
									<span>Client Storage (Browser)</span>
								</div>
							</SelectItem>
							<SelectItem value="cloud">
								<div class="flex items-center gap-2">
									<Cloud class="h-4 w-4" />
									<span>Cloud Storage</span>
								</div>
							</SelectItem>
							<SelectItem value="hybrid">
								<div class="flex items-center gap-2">
									<RefreshCw class="h-4 w-4" />
									<span>Hybrid (Local + Cloud Sync)</span>
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
					<p class="text-xs text-muted-foreground">
						{getStorageModeDescription(storageProvider)}
					</p>
				</div>

				<!-- Client Storage Backend Selection (only show for client/hybrid modes) -->
				{#if storageProvider !== 'cloud' && availableBackends.length > 0}
					<div class="space-y-2">
						<Label>Storage Backend</Label>
						<Select type="single" bind:value={selectedBackend}>
							<SelectTrigger class="w-full">
								{selectedBackend === 'auto'
									? 'Auto (Best Available)'
									: getBackendDisplayName(selectedBackend)}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="auto">Auto (Best Available)</SelectItem>
								{#each availableBackends as backend}
									<SelectItem value={backend}>{getBackendDisplayName(backend)}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
						<div class="flex flex-wrap gap-1">
							{#each availableBackends as backend}
								<Badge variant="secondary" class="text-xs">
									{getBackendDisplayName(backend)}
								</Badge>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={handleDiscard} disabled={isUploading}>
				<X class="mr-2 h-4 w-4" />
				Discard
			</Button>
			<Button variant="outline" onclick={handleReRecord} disabled={isUploading}>
				<RotateCcw class="mr-2 h-4 w-4" />
				Re-record
			</Button>
			<Button onclick={handleSave} disabled={isUploading}>
				{#if isUploading}
					{#if storageProvider === 'cloud'}
						<UploadCloud class="mr-2 h-4 w-4 animate-bounce" />
						Uploading...
					{:else}
						<HardDrive class="mr-2 h-4 w-4 animate-pulse" />
						Saving...
					{/if}
				{:else if storageProvider === 'cloud'}
					<UploadCloud class="mr-2 h-4 w-4" />
					Upload to Cloud
				{:else if storageProvider === 'hybrid'}
					<RefreshCw class="mr-2 h-4 w-4" />
					Save & Sync
				{:else}
					<Save class="mr-2 h-4 w-4" />
					Save Locally
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
