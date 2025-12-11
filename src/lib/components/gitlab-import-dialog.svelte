<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { GitLabImporter, type GitLabRepository, type MergeRequest } from '$lib/utils/gitlab-import';
	import { LanguageDetector } from '$lib/utils/language-detector';
	import Search from '@lucide/svelte/icons/search';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import GitMerge from '@lucide/svelte/icons/git-merge';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		onImport: (data: { title: string; code: string; language: string; prUrl: string }) => void;
	}

	let { open = $bindable(), onImport }: Props = $props();

	let accessToken = $state('');
	let importer: GitLabImporter | null = $state(null);
	let step = $state<'token' | 'repos' | 'mrs'>('token');
	let loading = $state(false);
	let repositories = $state<GitLabRepository[]>([]);
	let mergeRequests = $state<MergeRequest[]>([]);
	let selectedRepo: GitLabRepository | null = $state(null);
	let repoSearch = $state('');
	let baseUrl = $state('https://gitlab.com');

	async function connectGitLab() {
		if (!accessToken) {
			toast.error('Please enter your GitLab access token');
			return;
		}

		loading = true;
		try {
			importer = new GitLabImporter(accessToken, baseUrl);
			repositories = await importer.getUserRepos();
			step = 'repos';
			toast.success('Connected to GitLab');
		} catch (error) {
			toast.error('Failed to connect to GitLab. Check your token.');
			console.error(error);
		} finally {
			loading = false;
		}
	}

	async function selectRepository(repo: GitLabRepository) {
		if (!importer) return;

		loading = true;
		selectedRepo = repo;
		try {
			mergeRequests = await importer.getRepoMergeRequests(repo.id);
			step = 'mrs';
		} catch (error) {
			toast.error('Failed to load merge requests');
			console.error(error);
		} finally {
			loading = false;
		}
	}

	async function importMergeRequest(mr: MergeRequest) {
		if (!importer || !selectedRepo) return;

		loading = true;
		try {
			const diff = await importer.getMergeRequestUnifiedDiff(selectedRepo.id, mr.iid);
			
			// Detect language from first file
			const changes = await importer.getMergeRequestDiff(selectedRepo.id, mr.iid);
			const firstFile = changes[0];
			const language = firstFile
				? LanguageDetector.detectFromFilename(firstFile.new_path)
				: 'plaintext';

			onImport({
				title: mr.title,
				code: diff,
				language,
				prUrl: mr.web_url
			});

			open = false;
			toast.success('Merge request imported successfully');
		} catch (error) {
			toast.error('Failed to import merge request');
			console.error(error);
		} finally {
			loading = false;
		}
	}

	function resetDialog() {
		step = 'token';
		selectedRepo = null;
		repositories = [];
		mergeRequests = [];
		repoSearch = '';
	}

	$effect(() => {
		if (!open) {
			resetDialog();
		}
	});

	const filteredRepos = $derived(
		repositories.filter((repo) =>
			repo.path_with_namespace.toLowerCase().includes(repoSearch.toLowerCase()) ||
			(repo.description || '').toLowerCase().includes(repoSearch.toLowerCase())
		)
	);
</script>

<Dialog bind:open>
	<DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Import from GitLab</DialogTitle>
		</DialogHeader>

		<Tabs value={step}>
			<TabsList class="grid w-full grid-cols-3">
				<TabsTrigger value="token">1. Connect</TabsTrigger>
				<TabsTrigger value="repos" disabled={step === 'token'}>2. Repository</TabsTrigger>
				<TabsTrigger value="mrs" disabled={step !== 'mrs'}>3. Merge Request</TabsTrigger>
			</TabsList>

			<!-- Step 1: Token -->
			<TabsContent value="token" class="space-y-4">
				<div class="space-y-2">
					<Label for="baseUrl">GitLab Instance URL</Label>
					<Input
						id="baseUrl"
						bind:value={baseUrl}
						placeholder="https://gitlab.com"
						disabled={loading}
					/>
					<p class="text-xs text-muted-foreground">
						Use https://gitlab.com for GitLab.com or your self-hosted instance URL
					</p>
				</div>

				<div class="space-y-2">
					<Label for="token">Access Token</Label>
					<Input
						id="token"
						type="password"
						bind:value={accessToken}
						placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
						disabled={loading}
					/>
					<p class="text-xs text-muted-foreground">
						Create a personal access token with 'read_api' scope in GitLab Settings → Access Tokens
					</p>
				</div>

				<Button onclick={connectGitLab} disabled={loading} class="w-full">
					{#if loading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Connect to GitLab
				</Button>
			</TabsContent>

			<!-- Step 2: Repositories -->
			<TabsContent value="repos" class="space-y-4">
				<div class="space-y-2">
					<Label for="search">Search Repositories</Label>
					<div class="relative">
						<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							id="search"
							bind:value={repoSearch}
							placeholder="Search repositories..."
							class="pl-8"
							disabled={loading}
						/>
					</div>
				</div>

				<div class="space-y-2 max-h-96 overflow-y-auto">
					{#each filteredRepos as repo}
						<button
							onclick={() => selectRepository(repo)}
							disabled={loading}
							class="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
						>
							<div class="flex items-start justify-between">
								<div class="space-y-1 flex-1">
									<div class="flex items-center gap-2">
										<GitBranch class="h-4 w-4" />
										<p class="font-medium">{repo.path_with_namespace}</p>
										{#if repo.visibility === 'private'}
											<span class="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
												Private
											</span>
										{/if}
									</div>
									{#if repo.description}
										<p class="text-sm text-muted-foreground">{repo.description}</p>
									{/if}
									<p class="text-xs text-muted-foreground">
										Updated {new Date(repo.last_activity_at).toLocaleDateString()}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</TabsContent>

			<!-- Step 3: Merge Requests -->
			<TabsContent value="mrs" class="space-y-4">
				{#if selectedRepo}
					<div class="p-3 bg-muted rounded-lg">
						<p class="text-sm font-medium">{selectedRepo.path_with_namespace}</p>
					</div>
				{/if}

				<div class="space-y-2 max-h-96 overflow-y-auto">
					{#each mergeRequests as mr}
						<button
							onclick={() => importMergeRequest(mr)}
							disabled={loading}
							class="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
						>
							<div class="flex items-start gap-3">
								<GitMerge class="h-5 w-5 mt-0.5" />
								<div class="space-y-1 flex-1">
									<div class="flex items-center gap-2">
										<p class="font-medium">!{mr.iid} {mr.title}</p>
										<span
											class="text-xs px-1.5 py-0.5 rounded"
											class:bg-green-100={mr.state === 'merged'}
											class:text-green-800={mr.state === 'merged'}
											class:bg-blue-100={mr.state === 'opened'}
											class:text-blue-800={mr.state === 'opened'}
											class:bg-gray-100={mr.state === 'closed'}
											class:text-gray-800={mr.state === 'closed'}
										>
											{mr.state}
										</span>
									</div>
									<p class="text-sm text-muted-foreground">
										{mr.source_branch} → {mr.target_branch}
									</p>
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										<img
											src={mr.author.avatar_url}
											alt={mr.author.username}
											class="h-4 w-4 rounded-full"
										/>
										<span>@{mr.author.username}</span>
										<span>•</span>
										<span>Updated {new Date(mr.updated_at).toLocaleDateString()}</span>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</TabsContent>
		</Tabs>
	</DialogContent>
</Dialog>
