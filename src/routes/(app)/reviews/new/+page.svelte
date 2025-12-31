<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Upload from '@lucide/svelte/icons/upload';
	import Github from '@lucide/svelte/icons/github';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import Save from '@lucide/svelte/icons/save';
	import VideoIcon from '@lucide/svelte/icons/video';
	import Circle from '@lucide/svelte/icons/circle';
	import Square from '@lucide/svelte/icons/square';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import AuthGuard from '$lib/components/auth-guard.svelte';
	import PaywallDialog from '$lib/components/paywall-dialog.svelte';
	import LimitReached from '$lib/components/limit-reached.svelte';
	import UpgradeDialog from '$lib/components/upgrade-dialog.svelte';
	import CodeEditor from '$lib/components/code-editor.svelte';
	import MediaRecorder from '$lib/components/media-recorder.svelte';
	import VideoUploader from '$lib/components/video-uploader.svelte';
	import GitHubImportDialog from '$lib/components/github-import-dialog.svelte';
	import GitLabImportDialog from '$lib/components/gitlab-import-dialog.svelte';
	import LocalGitBrowser from '$lib/components/git-repo-browser.svelte';
	import AIAnalysisPanel from '$lib/components/ai-analysis-panel.svelte';
	import ReviewChecklist from '$lib/components/review-checklist.svelte';
	import {
		reviewsStore,
		projectsStore,
		subscriptionsStore,
		aiUsageStore
	} from '$lib/stores/index.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { analyzeCodeAI, checkReviewItemsAI } from '$lib/ai.remote';
	import { checklistTemplates, getTemplate } from '$lib/config/checklist-templates';
	import { hasFeatureAccess, getLimit, isWithinLimit } from '$lib/config';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import type { CodeAnalysis } from '$lib/server/ai';

	let step = $state(1);
	let title = $state('');
	let description = $state('');
	let projectId = $state(page.url.searchParams.get('project') || '');
	let code = $state('');
	let language = $state('javascript');
	let isRecording = $state(false);
	let recordingTime = $state(0);
	let uploadedVideoUrl = $state<string>('');
	let uploadedThumbnailUrl = $state<string>('');
	let uploadedMetadata = $state<any>(null);
	let aiSummary = $state('');
	let loading = $state(false);
	let showPaywall = $state(false);
	let showUpgrade = $state(false);
	let showLimitReached = $state(false);
	let videoMethod = $state<'record' | 'upload'>('record');
	let reviewId = $state<string>('');
	let showGitHubImport = $state(false);
	let showGitLabImport = $state(false);
	let showLocalGitBrowser = $state(false);
	let analysis = $state<CodeAnalysis | null>(null);
	let analysisLoading = $state(false);
	let recordingEvents = $state<{ type: string; time: number; scrollTop: number }[]>([]);
	let recordingStartTime = $state(0);
	let checklistTemplate = $state('general');
	let checklistItems = $state<Record<string, boolean>>({});
	let checklistNotes = $state<Record<string, string>>({});
	let checklistLoading = $state(false);

	// Smart Recording Workflow State
	let showRecordingIndicator = $state(false);
	let isPaused = $state(false);
	let mediaRecorderRef = $state<ReturnType<typeof MediaRecorder>>();

	const userPlan = $derived(auth.currentUser?.plan || 'free');
	const reviewCount = $derived(reviewsStore.count);
	const reviewLimit = $derived(getLimit(userPlan as any, 'localReviews'));
	const canCreateReview = $derived(isWithinLimit(reviewCount, reviewLimit));
	const hasAI = $derived(hasFeatureAccess(userPlan as any, 'advancedAI'));

	const projects = $derived(
		projectsStore.data || [
			{ id: '1', name: 'My Awesome App' },
			{ id: '2', name: 'Backend API' },
			{ id: '3', name: 'Mobile App' }
		]
	);

	const languages = [
		'javascript',
		'typescript',
		'python',
		'java',
		'go',
		'rust',
		'php',
		'ruby',
		'c',
		'cpp',
		'csharp',
		'html',
		'css'
	];

	async function runAIAnalysis() {
		if (!hasAI) {
			showPaywall = true;
			return;
		}

		if (!code) {
			toast.error('Please add some code first');
			return;
		}

		analysisLoading = true;
		try {
			analysis = await analyzeCodeAI({
				code,
				language,
				reviewId: reviewId || undefined
			});

			if (analysis) {
				aiSummary = analysis.summary;
				// Auto-save summary if we have a draft
				if (reviewId) {
					await reviewsStore.update(reviewId, { aiSummary });
				}
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to analyze code');
		} finally {
			analysisLoading = false;
		}
	}

	async function handleAutoCheck() {
		if (!hasAI) {
			showPaywall = true;
			return;
		}

		if (!code) {
			toast.error('Please add some code first');
			return;
		}

		checklistLoading = true;
		try {
			const template = getTemplate(checklistTemplate);
			if (!template) return;

			const result = await checkReviewItemsAI({
				code,
				language,
				reviewId: reviewId || undefined,
				checklistItems: template.items
			});

			const newChecked: Record<string, boolean> = { ...checklistItems };
			result.checkedItems.forEach((id) => {
				newChecked[id] = true;
			});
			checklistItems = newChecked;
			checklistNotes = result.notes;

			toast.success(`AI verified ${result.checkedItems.length} items`);
		} catch (error: any) {
			toast.error(error.message || 'Failed to check items');
		} finally {
			checklistLoading = false;
		}
	}

	function handleGitHubImport(data: {
		title: string;
		code: string;
		language: string;
		prUrl: string;
	}) {
		title = data.title;
		code = data.code;
		language = data.language;
		description = `Imported from: ${data.prUrl}`;
		showGitHubImport = false;
		toast.success('Pull request imported successfully');
	}

	function handleGitLabImport(data: {
		title: string;
		code: string;
		language: string;
		mrUrl: string;
	}) {
		title = data.title;
		code = data.code;
		language = data.language;
		description = `Imported from: ${data.mrUrl}`;
		showGitLabImport = false;
		toast.success('Merge request imported successfully');
	}

	function handleLocalGitImport(data: {
		title: string;
		code: string;
		language: string;
		commitHash: string;
	}) {
		title = data.title;
		code = data.code;
		language = data.language;
		description = `Imported from commit: ${data.commitHash}`;
		showLocalGitBrowser = false;
		toast.success('Git commit imported successfully');
	}

	function handleRecordingStart() {
		isRecording = true;
		recordingStartTime = Date.now();
		recordingEvents = [];
		showRecordingIndicator = true;

		// Auto-navigate to code editor step
		if (step !== 2) {
			step = 2;
		}
	}

	function handleRecordingEnd() {
		isRecording = false;
		showRecordingIndicator = false;
		isPaused = false;

		// Navigate back to video step so user can save
		step = 3;
	}

	function handleRecordingPause() {
		isPaused = true;
	}

	function handleRecordingResume() {
		isPaused = false;
	}

	function handlePauseRecording() {
		if (mediaRecorderRef) {
			if (isPaused) {
				mediaRecorderRef.externalResume();
			} else {
				mediaRecorderRef.externalPause();
			}
		}
	}

	function handleStopRecording() {
		if (mediaRecorderRef) {
			mediaRecorderRef.externalStop();
		}
	}

	function formatRecordingTime(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleEditorScroll(e: Event) {
		if (isRecording) {
			const target = e.target as HTMLElement;
			recordingEvents.push({
				type: 'scroll',
				time: Date.now() - recordingStartTime,
				scrollTop: target.scrollTop
			});
		}
	}

	async function handleDiffFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const fileName = file.name;

		// Check if it's a .diff or .patch file
		if (!fileName.endsWith('.diff') && !fileName.endsWith('.patch')) {
			toast.error('Please upload a .diff or .patch file');
			return;
		}

		try {
			const text = await file.text();
			// Parse diff file using DiffParser utility
			const { DiffParser } = await import('$lib/utils/diff-parser');
			const parsed = DiffParser.parse(text);

			if (parsed.files && parsed.files.length > 0) {
				// Use first file's language or auto-detect
				language = parsed.language || 'javascript';
				code = parsed.content || text;
				title = parsed.title || `Imported from ${fileName}`;
				description = parsed.stats
					? `${parsed.stats.additions} additions, ${parsed.stats.deletions} deletions`
					: '';
				toast.success('Diff file parsed successfully');
			} else {
				// Fallback: use raw content
				code = text;
				toast.success('File uploaded successfully');
			}
		} catch (error) {
			toast.error('Failed to parse diff file');
			console.error(error);
		}
	}

	async function saveDraft() {
		try {
			if (!reviewId) {
				// Create a new draft review
				const draft = await reviewsStore.create({
					title: title || 'Untitled Review',
					description,
					projectId,
					authorId: auth.currentUser?.id || '',
					codeContent: code,
					codeLanguage: language,
					videoUrl: null,
					videoSize: null,
					videoDuration: null,
					thumbnailUrl: null,
					shareToken: crypto.randomUUID(),
					isPublic: false,
					status: 'draft',
					aiSummary
					// metadata: { recordingEvents: $state.snapshot(recordingEvents) }
				});
				reviewId = draft.id;
			} else {
				// Update existing draft
				await reviewsStore.update(reviewId, {
					title,
					description,
					codeContent: code,
					codeLanguage: language,
					videoUrl: uploadedVideoUrl || undefined,
					videoSize: uploadedMetadata?.size || undefined,
					videoDuration: uploadedMetadata?.duration || undefined,
					thumbnailUrl: uploadedThumbnailUrl || undefined,
					aiSummary
					// metadata: { recordingEvents: $state.snapshot(recordingEvents) }
				});
			}
			toast.success('Draft saved');
		} catch (error) {
			console.error(error);
			toast.error('Failed to save draft');
		}
	}

	async function publishReview() {
		if (!canCreateReview) {
			showLimitReached = true;
			return;
		}

		try {
			if (reviewId) {
				// Update existing draft to published
				await reviewsStore.update(reviewId, {
					status: 'published',
					title,
					description,
					codeContent: code,
					codeLanguage: language,
					aiSummary,
					metadata: { recordingEvents }
				});
			} else {
				// Create new published review
				await reviewsStore.create({
					title,
					description,
					projectId,
					authorId: auth.currentUser?.id || '',
					codeContent: code,
					codeLanguage: language,
					videoUrl: uploadedVideoUrl || null,
					videoSize: uploadedMetadata?.size || null,
					videoDuration: uploadedMetadata?.duration || null,
					thumbnailUrl: uploadedThumbnailUrl || null,
					shareToken: crypto.randomUUID(),
					isPublic: false,
					status: 'published',
					aiSummary,
					metadata: { recordingEvents }
				});
			}

			toast.success('Review published!');
			goto('/reviews');
		} catch (error) {
			toast.error('Failed to publish review');
		}
	}
</script>

<!-- Floating Recording Indicator -->
{#if showRecordingIndicator}
	<div
		class="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-500/95 text-white px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm"
	>
		<span class="relative flex h-3 w-3">
			<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"
			></span>
			<span
				class="relative inline-flex rounded-full h-3 w-3 bg-white {isPaused ? 'opacity-50' : ''}"
			></span>
		</span>
		<span class="font-mono font-medium text-sm">
			{isPaused ? 'PAUSED' : 'REC'}
			{formatRecordingTime(recordingTime)}
		</span>
		<div class="flex items-center gap-1 ml-2 border-l border-white/30 pl-2">
			<Button
				size="sm"
				variant="ghost"
				class="text-white hover:bg-white/20 h-7 w-7 p-0"
				onclick={handlePauseRecording}
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
				class="text-white hover:bg-white/20 h-7 w-7 p-0"
				onclick={handleStopRecording}
				title="Stop Recording (S)"
			>
				<Square class="h-4 w-4" />
			</Button>
		</div>
	</div>
{/if}

<AuthGuard requireAuth requirePlan="free">
	{#if !canCreateReview}
		<div class="max-w-4xl mx-auto space-y-6 py-8">
			<LimitReached
				type="cloud-reviews"
				current={reviewCount}
				limit={reviewLimit}
				onUpgrade={() => (showUpgrade = true)}
			/>
		</div>
	{:else}
		<div class="max-w-4xl mx-auto space-y-6">
			<!-- Header -->
			<div class="flex items-center gap-4">
				<Button variant="ghost" size="icon" href="/dashboard">
					<ArrowLeft class="h-5 w-5" />
				</Button>
				<div class="flex-1">
					<h1 class="text-3xl font-bold">Create Review</h1>
					<p class="text-muted-foreground">Walk through your code changes</p>
				</div>
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<div class="flex gap-1">
						{#each Array(3) as _, i}
							<div class="h-2 w-2 rounded-full {i < step ? 'bg-primary' : 'bg-muted'}"></div>
						{/each}
					</div>
					<span>Step {step} of 3</span>
				</div>
			</div>

			{#if step === 1}
				<!-- Step 1: Basic Information -->
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>Give your review a title and description</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="title">Review Title</Label>
							<Input id="title" placeholder="Add user authentication" bind:value={title} required />
						</div>

						<div class="space-y-2">
							<Label for="description">Description (optional)</Label>
							<Textarea
								id="description"
								placeholder="Implemented JWT-based authentication..."
								rows={3}
								bind:value={description}
							/>
						</div>

						<div class="space-y-2">
							<Label for="project">Project</Label>
							<Select type="single" bind:value={projectId}>
								<SelectTrigger>
									{projects.find((p) => p.id === projectId)?.name || 'Select project'}
								</SelectTrigger>
								<SelectContent>
									{#each projects as project}
										<SelectItem value={project.id}>{project.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<div class="flex justify-end gap-2 pt-4">
							<Button variant="outline" onclick={saveDraft}>
								<Save class="h-4 w-4 mr-2" />
								Save Draft
							</Button>
							<Button onclick={() => (step = 2)} disabled={!title}>Next</Button>
						</div>
					</CardContent>
				</Card>
			{/if}

			{#if step === 2}
				<!-- Step 2: Add Code -->
				<Card>
					<CardHeader>
						<CardTitle>Add Code</CardTitle>
						<CardDescription>Add the code you want to review</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs value="paste" class="w-full">
							<TabsList class="grid w-full grid-cols-5">
								<TabsTrigger value="paste">Paste</TabsTrigger>
								<TabsTrigger value="upload">Upload</TabsTrigger>
								<TabsTrigger value="github">GitHub</TabsTrigger>
								<TabsTrigger value="gitlab">GitLab</TabsTrigger>
								<TabsTrigger value="git">Local Git</TabsTrigger>
							</TabsList>

							<TabsContent value="paste" class="space-y-4">
								<div class="space-y-2">
									<Label>Language</Label>
									<Select bind:value={language}>
										<SelectTrigger>
											{language || 'Auto-detect'}
										</SelectTrigger>
										<SelectContent>
											{#each languages as lang}
												<SelectItem value={lang}>
													{lang.charAt(0).toUpperCase() + lang.slice(1)}
												</SelectItem>
											{/each}
										</SelectContent>
									</Select>
								</div>

								<CodeEditor
									bind:value={code}
									{language}
									readonly={false}
									showLineNumbers={true}
									onscroll={handleEditorScroll}
								/>
							</TabsContent>

							<TabsContent value="upload" class="space-y-4">
								<div
									class="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors"
								>
									<Upload class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
									<p class="text-sm text-muted-foreground mb-2">
										Drag & drop files or click to browse
									</p>
									<input
										type="file"
										id="file-upload"
										class="hidden"
										accept=".js,.ts,.py,.diff,.patch,.java,.go,.rs,.rb,.php,.c,.cpp,.cs,.html,.css"
										onchange={handleDiffFileUpload}
									/>
									<Button
										variant="outline"
										size="sm"
										onclick={() => document.getElementById('file-upload')?.click()}
									>
										Choose Files
									</Button>
									<p class="text-xs text-muted-foreground mt-2">
										Supports .js, .ts, .py, .diff, .patch and more
									</p>
								</div>
							</TabsContent>

							<TabsContent value="github">
								<div class="space-y-4">
									<Button
										variant="outline"
										class="w-full gap-2"
										onclick={() => (showGitHubImport = true)}
									>
										<Github class="h-4 w-4" />
										Connect GitHub
									</Button>
									<p class="text-sm text-muted-foreground text-center">
										Connect your GitHub account to import pull requests
									</p>
								</div>
							</TabsContent>

							<TabsContent value="gitlab">
								<div class="space-y-4">
									<Button
										variant="outline"
										class="w-full gap-2"
										onclick={() => (showGitLabImport = true)}
									>
										<FolderGit2 class="h-4 w-4" />
										Connect GitLab
									</Button>
									<p class="text-sm text-muted-foreground text-center">
										Connect your GitLab account to import merge requests
									</p>
								</div>
							</TabsContent>

							<TabsContent value="git">
								<div class="space-y-4">
									<Button
										variant="outline"
										class="w-full gap-2"
										onclick={() => (showLocalGitBrowser = true)}
									>
										<FolderGit2 class="h-4 w-4" />
										Browse Local Repository
									</Button>
									<p class="text-sm text-muted-foreground text-center">
										Select a local git repository to import changes (Chrome/Edge only)
									</p>
								</div>
							</TabsContent>
						</Tabs>

						<div class="flex justify-between gap-2 pt-4">
							<Button variant="ghost" onclick={() => (step = 1)}>Back</Button>
							<div class="flex gap-2">
								<Button variant="outline" onclick={saveDraft}>
									<Save class="h-4 w-4 mr-2" />
									Save Draft
								</Button>
								<Button onclick={() => (step = 3)} disabled={!code}>Next</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			{#if step === 3}
				<!-- Step 3: Add Video -->
				<div class="grid gap-4 lg:grid-cols-3">
					<div class="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle>Video Walkthrough</CardTitle>
								<CardDescription>Record or upload a video explaining the changes</CardDescription>
							</CardHeader>
							<CardContent class="space-y-4">
								<Tabs bind:value={videoMethod} class="w-full">
									<TabsList class="grid w-full grid-cols-2">
										<TabsTrigger value="record">Record</TabsTrigger>
										<TabsTrigger value="upload">Upload</TabsTrigger>
									</TabsList>

									<TabsContent value="record" class="space-y-4">
										{#if reviewId}
											<MediaRecorder
												bind:this={mediaRecorderRef}
												{reviewId}
												onUploadComplete={(result) => {
													uploadedVideoUrl = result.videoUrl;
													uploadedThumbnailUrl = result.thumbnailUrl;
													uploadedMetadata = result.metadata;
													isRecording = false;
													toast.success('Video attached to review');
												}}
												onStart={handleRecordingStart}
												onEnd={handleRecordingEnd}
												onPause={handleRecordingPause}
												onResume={handleRecordingResume}
												maxDuration={600}
												quality="high"
											/>
										{:else}
											<div class="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
												<p>Please save draft first to enable recording</p>
												<Button variant="outline" size="sm" onclick={saveDraft} class="mt-2">
													<Save class="h-4 w-4 mr-2" /> Save Draft
												</Button>
											</div>
										{/if}
									</TabsContent>

									<TabsContent value="upload" class="space-y-4">
										{#if reviewId}
											<VideoUploader
												{reviewId}
												onUploadComplete={(result) => {
													toast.success('Video uploaded successfully!');
													// You can handle the uploaded video URL here if needed
												}}
											/>
										{:else}
											<div class="text-center py-8 text-muted-foreground">
												<p>Save draft first to enable video upload</p>
											</div>
										{/if}
									</TabsContent>
								</Tabs>

								<div class="flex justify-between gap-2 pt-4">
									<Button variant="ghost" onclick={() => (step = 2)}>Back</Button>
									<div class="flex gap-2">
										<Button variant="outline" onclick={saveDraft}>
											<Save class="h-4 w-4 mr-2" />
											Save Draft
										</Button>
										<Button
											onclick={publishReview}
											disabled={!uploadedVideoUrl && videoMethod === 'record'}
										>
											Publish Review
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<!-- AI Panel -->
					<div class="space-y-4">
						<AIAnalysisPanel
							{analysis}
							loading={analysisLoading}
							onAnalyze={runAIAnalysis}
							{code}
						/>

						<ReviewChecklist
							bind:selectedTemplate={checklistTemplate}
							bind:checkedItems={checklistItems}
							aiNotes={checklistNotes}
							loading={checklistLoading}
							onAutoCheck={handleAutoCheck}
						/>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</AuthGuard>

<PaywallDialog
	bind:open={showPaywall}
	feature="Advanced AI Features"
	requiredPlan="pro"
	onUpgrade={() => (showUpgrade = true)}
/>

<UpgradeDialog bind:open={showUpgrade} currentPlan={userPlan as any} />

<GitHubImportDialog
	bind:open={showGitHubImport}
	onClose={() => (showGitHubImport = false)}
	onImport={handleGitHubImport}
/>

<GitLabImportDialog
	bind:open={showGitLabImport}
	onClose={() => (showGitLabImport = false)}
	onImport={handleGitLabImport}
/>

<LocalGitBrowser
	bind:open={showLocalGitBrowser}
	onClose={() => (showLocalGitBrowser = false)}
	onImport={handleLocalGitImport}
/>
