<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import GitCommit from '@lucide/svelte/icons/git-commit';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		onImport: (data: { title: string; code: string; language: string; commitHash: string }) => void;
	}

	let { open = $bindable(), onImport }: Props = $props();

	let loading = $state(false);
	let repoPath = $state('');
	let commits: Array<{ hash: string; message: string; author: string; date: string; diff: string }> = $state([]);
	let currentBranch = $state('');

	async function browseRepository() {
		if (!('showDirectoryPicker' in window)) {
			toast.error('Your browser does not support the File System Access API. Please use Chrome or Edge.');
			return;
		}

		try {
			// @ts-ignore - FileSystem API
			const dirHandle = await window.showDirectoryPicker();
			
			// Check if .git directory exists
			let gitDirHandle;
			try {
				gitDirHandle = await dirHandle.getDirectoryHandle('.git');
			} catch {
				toast.error('This directory does not appear to be a Git repository.');
				return;
			}

			loading = true;
			toast.success('Repository loaded. Note: Full git parsing requires a backend service.');
			repoPath = dirHandle.name;
			
			// In a real implementation, you would send the directory path to a backend
			// that uses a git library (like nodegit or simple-git) to read the repository.
			// For now, we'll show a placeholder message.
			
			loading = false;
			
			// Demo commits (in production, fetch from backend)
			commits = [
				{
					hash: 'abc1234',
					message: 'Add new feature',
					author: 'User Name',
					date: new Date().toISOString(),
					diff: 'Demo diff content would be here'
				}
			];
			currentBranch = 'main';
			
		} catch (error) {
			toast.error('Failed to access repository');
			console.error(error);
			loading = false;
		}
	}

	async function uploadGitBundle() {
		toast.info('Git bundle upload coming soon. For now, use the diff/patch upload feature.');
	}

	function importCommit(commit: typeof commits[0]) {
		onImport({
			title: commit.message,
			code: commit.diff,
			language: 'diff',
			commitHash: commit.hash
		});
		open = false;
		toast.success('Commit imported successfully');
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Browse Local Git Repository</DialogTitle>
		</DialogHeader>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label>Repository</Label>
				<div class="flex gap-2">
					<Button onclick={browseRepository} disabled={loading} class="flex-1">
						{#if loading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<FolderGit2 class="mr-2 h-4 w-4" />
						{/if}
						Browse Local Repository
					</Button>
					<Button variant="outline" onclick={uploadGitBundle} disabled={loading}>
						Upload Git Bundle
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Select a local .git directory to browse commits. Requires File System Access API (Chrome/Edge).
				</p>
			</div>

			{#if repoPath}
				<div class="p-3 bg-muted rounded-lg space-y-2">
					<div class="flex items-center gap-2">
						<FolderGit2 class="h-4 w-4" />
						<p class="font-medium">{repoPath}</p>
					</div>
					{#if currentBranch}
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<GitBranch class="h-3 w-3" />
							<span>Branch: {currentBranch}</span>
						</div>
					{/if}
				</div>

				<div class="space-y-2">
					<Label>Commits</Label>
					<div class="space-y-2 max-h-96 overflow-y-auto">
						{#each commits as commit}
							<button
								onclick={() => importCommit(commit)}
								class="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
							>
								<div class="flex items-start gap-3">
									<GitCommit class="h-5 w-5 mt-0.5" />
									<div class="space-y-1 flex-1">
										<p class="font-medium">{commit.message}</p>
										<div class="flex items-center gap-2 text-xs text-muted-foreground">
											<code class="px-1 py-0.5 rounded bg-muted">{commit.hash.substring(0, 7)}</code>
											<span>•</span>
											<span>{commit.author}</span>
											<span>•</span>
											<span>{new Date(commit.date).toLocaleDateString()}</span>
										</div>
									</div>
								</div>
							</button>
						{:else}
							<p class="text-sm text-muted-foreground text-center py-8">
								No commits found. This is a demo - full implementation requires backend support.
							</p>
						{/each}
					</div>
				</div>
			{/if}

			<div class="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
				<p class="text-sm text-blue-900 dark:text-blue-100">
					<strong>Note:</strong> Full local git repository browsing requires a backend service with git access.
					For now, you can use the "Upload Diff" tab to upload .diff or .patch files directly.
				</p>
			</div>
		</div>
	</DialogContent>
</Dialog>
