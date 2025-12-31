<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Slider } from '$lib/components/ui/slider';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import { settingsStore } from '$lib/stores/index.svelte';
	import {
		detectAvailableBackends,
		createClientVideoStorage,
		formatStorageSize,
		getBackendDisplayName,
		type ClientStorageBackend,
		type StorageInfo
	} from '$lib/utils/client-video-storage';
	import HardDrive from '@lucide/svelte/icons/hard-drive';
	import Cloud from '@lucide/svelte/icons/cloud';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Database from '@lucide/svelte/icons/database';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const settings = $derived(settingsStore.settings);
	let saving = $state(false);
	let availableBackends = $state<ClientStorageBackend[]>([]);
	let storageInfo = $state<StorageInfo | null>(null);
	let loadingStorageInfo = $state(false);

	// Load available backends and storage info on mount
	$effect(() => {
		loadStorageInfo();
	});

	async function loadStorageInfo() {
		loadingStorageInfo = true;
		try {
			availableBackends = await detectAvailableBackends();

			if (settings.storageProvider !== 'cloud') {
				const backend =
					settings.clientStorageBackend === 'auto' ? undefined : settings.clientStorageBackend;
				const storage = await createClientVideoStorage(backend as ClientStorageBackend | undefined);
				storageInfo = await storage.getStorageInfo();
			}
		} catch (error) {
			console.error('Failed to load storage info:', error);
		} finally {
			loadingStorageInfo = false;
		}
	}

	function updateSetting(key: keyof typeof settings, value: any) {
		settingsStore.update({ [key]: value });

		// Reload storage info if storage settings changed
		if (key === 'storageProvider' || key === 'clientStorageBackend') {
			loadStorageInfo();
		}
	}

	async function handleSave() {
		saving = true;
		try {
			await new Promise((resolve) => setTimeout(resolve, 500));
			toast.success('Video settings saved');
		} finally {
			saving = false;
		}
	}

	async function clearClientStorage() {
		if (
			!confirm('Are you sure you want to delete all locally stored videos? This cannot be undone.')
		) {
			return;
		}

		try {
			const storage = await createClientVideoStorage();
			const videos = await storage.list();

			for (const video of videos) {
				await storage.delete(video.id);
			}

			toast.success(`Deleted ${videos.length} video(s) from local storage`);
			loadStorageInfo();
		} catch (error: any) {
			toast.error('Failed to clear storage: ' + error.message);
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold">Video Settings</h2>
		<p class="text-muted-foreground">Configure video recording, playback, and storage</p>
	</div>

	<!-- Storage Settings -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Database class="h-5 w-5" />
				Storage Settings
			</CardTitle>
			<CardDescription>Configure where your video recordings are stored</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Storage Mode -->
			<div class="space-y-3">
				<Label>Storage Mode</Label>
				<div class="grid gap-3">
					<button
						class="flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left {settings.storageProvider ===
						'client'
							? 'border-primary bg-primary/5'
							: 'border-muted hover:border-muted-foreground/50'}"
						onclick={() => updateSetting('storageProvider', 'client')}
					>
						<HardDrive class="h-6 w-6 mt-0.5 text-primary" />
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium">Client Storage</span>
								<Badge variant="secondary">Offline-First</Badge>
							</div>
							<p class="text-sm text-muted-foreground mt-1">
								Videos are stored in your browser. Works offline and provides instant playback.
								Videos cannot be shared across devices.
							</p>
						</div>
					</button>

					<button
						class="flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left {settings.storageProvider ===
						'cloud'
							? 'border-primary bg-primary/5'
							: 'border-muted hover:border-muted-foreground/50'}"
						onclick={() => updateSetting('storageProvider', 'cloud')}
					>
						<Cloud class="h-6 w-6 mt-0.5 text-primary" />
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium">Cloud Storage</span>
								<Badge variant="secondary">Shareable</Badge>
							</div>
							<p class="text-sm text-muted-foreground mt-1">
								Videos are uploaded to your configured cloud storage (S3, R2, or local server).
								Accessible from any device and shareable with team members.
							</p>
						</div>
					</button>

					<button
						class="flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left {settings.storageProvider ===
						'hybrid'
							? 'border-primary bg-primary/5'
							: 'border-muted hover:border-muted-foreground/50'}"
						onclick={() => updateSetting('storageProvider', 'hybrid')}
					>
						<RefreshCw class="h-6 w-6 mt-0.5 text-primary" />
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium">Hybrid Storage</span>
								<Badge variant="secondary">Best of Both</Badge>
							</div>
							<p class="text-sm text-muted-foreground mt-1">
								Videos are saved locally first for instant access, then automatically synced to
								cloud storage in the background when online.
							</p>
						</div>
					</button>
				</div>
			</div>

			<!-- Client Storage Backend Selection -->
			{#if settings.storageProvider !== 'cloud'}
				<div class="space-y-3 pt-4 border-t">
					<Label>Local Storage Backend</Label>
					<Select
						type="single"
						value={settings.clientStorageBackend}
						onValueChange={(value) => updateSetting('clientStorageBackend', value)}
					>
						<SelectTrigger>
							{settings.clientStorageBackend === 'auto'
								? 'Auto (Best Available)'
								: getBackendDisplayName(settings.clientStorageBackend as ClientStorageBackend)}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="auto">Auto (Best Available)</SelectItem>
							{#each availableBackends as backend}
								<SelectItem value={backend}>{getBackendDisplayName(backend)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>

					<div class="flex items-center gap-2 flex-wrap">
						<span class="text-sm text-muted-foreground">Available:</span>
						{#each availableBackends as backend}
							<Badge variant="outline" class="text-xs">
								{getBackendDisplayName(backend)}
							</Badge>
						{/each}
						{#if availableBackends.length === 0}
							<Badge variant="destructive" class="text-xs">No storage backends available</Badge>
						{/if}
					</div>
				</div>

				<!-- Storage Info -->
				{#if storageInfo}
					<div class="space-y-2 pt-4 border-t">
						<Label>Storage Usage</Label>
						<div class="flex items-center gap-4">
							<div class="flex-1">
								<div class="h-2 bg-muted rounded-full overflow-hidden">
									<div
										class="h-full bg-primary transition-all duration-300"
										style="width: {Math.min(storageInfo.percentUsed, 100)}%"
									></div>
								</div>
							</div>
							<span class="text-sm text-muted-foreground whitespace-nowrap">
								{formatStorageSize(storageInfo.usedBytes)} / {formatStorageSize(
									storageInfo.quotaBytes
								)}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted-foreground">
								Backend: {getBackendDisplayName(storageInfo.backend)}
							</span>
							<Button
								variant="ghost"
								size="sm"
								class="text-destructive"
								onclick={clearClientStorage}
							>
								<Trash2 class="h-4 w-4 mr-1" />
								Clear Storage
							</Button>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Hybrid Sync Setting -->
			{#if settings.storageProvider === 'hybrid'}
				<div class="flex items-center justify-between pt-4 border-t">
					<div class="space-y-0.5">
						<Label>Auto-Sync to Cloud</Label>
						<p class="text-sm text-muted-foreground">
							Automatically upload videos to cloud when online
						</p>
					</div>
					<Switch
						checked={settings.hybridSyncEnabled}
						onCheckedChange={(checked) => updateSetting('hybridSyncEnabled', checked)}
					/>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Recording Settings -->
	<Card>
		<CardHeader>
			<CardTitle>Recording Settings</CardTitle>
			<CardDescription>Customize video recording options</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label>Auto-compress Videos</Label>
					<p class="text-sm text-muted-foreground">Reduce file size after recording</p>
				</div>
				<Switch
					checked={settings.autoCompress}
					onCheckedChange={(checked) => updateSetting('autoCompress', checked)}
				/>
			</div>

			<div class="space-y-2">
				<Label>Video Quality</Label>
				<Select
					type="single"
					value={settings.videoQuality}
					onValueChange={(value) =>
						updateSetting('videoQuality', value as 'low' | 'medium' | 'high')}
				>
					<SelectTrigger>
						{settings.videoQuality || ''}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="high">High (best quality)</SelectItem>
						<SelectItem value="medium">Medium (balanced)</SelectItem>
						<SelectItem value="low">Low (smallest size)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="space-y-2">
				<Label>Max Video Size</Label>
				<div class="flex items-center gap-4">
					<Slider
						value={[settings.maxVideoSize]}
						onValueChange={(value) => updateSetting('maxVideoSize', value[0])}
						max={500}
						min={50}
						step={10}
						class="flex-1"
					/>
					<span class="text-sm w-16 text-right">{settings.maxVideoSize} MB</span>
				</div>
			</div>

			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label>Include Audio by Default</Label>
					<p class="text-sm text-muted-foreground">Record system and microphone audio</p>
				</div>
				<Switch
					checked={settings.includeAudio}
					onCheckedChange={(checked) => updateSetting('includeAudio', checked)}
				/>
			</div>

			<div class="space-y-2">
				<Label>Countdown Duration</Label>
				<Select
					type="single"
					value={settings.countdown.toString()}
					onValueChange={(value) => updateSetting('countdown', parseInt(value))}
				>
					<SelectTrigger>
						{settings.countdown.toString() || ''}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">No countdown</SelectItem>
						<SelectItem value="3">3 seconds</SelectItem>
						<SelectItem value="5">5 seconds</SelectItem>
						<SelectItem value="10">10 seconds</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</CardContent>
	</Card>

	<!-- Playback Settings -->
	<Card>
		<CardHeader>
			<CardTitle>Playback Settings</CardTitle>
			<CardDescription>Customize video playback experience</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="space-y-2">
				<Label>Default Playback Speed</Label>
				<Select
					type="single"
					value={settings.defaultSpeed.toString()}
					onValueChange={(value) => updateSetting('defaultSpeed', parseFloat(value))}
				>
					<SelectTrigger>
						{settings.defaultSpeed.toString() || ''}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0.5">0.5x</SelectItem>
						<SelectItem value="1">1x (Normal)</SelectItem>
						<SelectItem value="1.5">1.5x</SelectItem>
						<SelectItem value="2">2x</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label>Auto-play Next Review</Label>
					<p class="text-sm text-muted-foreground">Automatically play next review in queue</p>
				</div>
				<Switch
					checked={settings.autoplay}
					onCheckedChange={(checked) => updateSetting('autoplay', checked)}
				/>
			</div>

			<Button onclick={handleSave} disabled={saving}>
				{saving ? 'Saving...' : 'Save Changes'}
			</Button>
		</CardContent>
	</Card>
</div>
