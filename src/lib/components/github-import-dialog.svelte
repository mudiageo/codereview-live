<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import Github from '@lucide/svelte/icons/github';
  import Search from '@lucide/svelte/icons/search';
  import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Settings from '@lucide/svelte/icons/settings';
  import { GitHubImporter, type Repository, type PullRequest } from '$lib/utils/github-import';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
    onImport: (data: { title: string; code: string; language: string; prUrl: string }) => void;
  }

  let { open = $bindable(), onClose, onImport }: Props = $props();

  let step = $state<'check' | 'connect' | 'auth' | 'repos' | 'prs' | 'import'>('check');
  let accessToken = $state('');
  let loading = $state(false);
  let repositories = $state<Repository[]>([]);
  let pullRequests = $state<PullRequest[]>([]);
  let selectedRepo = $state<Repository | null>(null);
  let selectedPr = $state<PullRequest | null>(null);
  let searchQuery = $state('');
  let importer = $state<GitHubImporter | null>(null);
  let connectedAccount = $state<{username: string; avatar_url?: string} | null>(null);
  let checkingConnection = $state(true);

  // Check for stored GitHub connection when dialog opens
  $effect(() => {
    if (open) {
      checkStoredConnection();
    }
  });

  async function checkStoredConnection() {
    checkingConnection = true;
    try {
      const response = await fetch('/api/oauth/connected');
      if (response.ok) {
        const accounts = await response.json();
        const githubAccount = accounts.find((acc: any) => acc.provider === 'github');
        
        if (githubAccount && githubAccount.accessToken) {
          // Use stored token
          accessToken = githubAccount.accessToken;
          connectedAccount = {
            username: githubAccount.username,
            avatar_url: githubAccount.avatar_url
          };
          
          // Initialize importer and fetch repos
          importer = new GitHubImporter(accessToken);
          repositories = await importer.getUserRepos(50);
          step = 'repos';
        } else {
          // No connection, show connect screen
          step = 'connect';
        }
      } else {
        step = 'connect';
      }
    } catch (error) {
      console.error('Failed to check GitHub connection:', error);
      step = 'connect';
    } finally {
      checkingConnection = false;
    }
  }

  const filteredRepos = $derived(
    repositories.filter(repo =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredPrs = $derived(
    pullRequests.filter(pr =>
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.number.toString().includes(searchQuery)
    )
  );

  async function handleAuth() {
    if (!accessToken.trim()) {
      toast.error('Please enter a GitHub access token');
      return;
    }

    loading = true;
    try {
      importer = new GitHubImporter(accessToken);
      repositories = await importer.getUserRepos(50);
      step = 'repos';
      toast.success('Connected to GitHub');
    } catch (error) {
      toast.error('Failed to authenticate with GitHub');
      console.error(error);
    } finally {
      loading = false;
    }
  }

  async function selectRepository(repo: Repository) {
    selectedRepo = repo;
    loading = true;
    searchQuery = '';

    try {
      if (!importer) throw new Error('No importer');
      const [owner, repoName] = repo.full_name.split('/');
      pullRequests = await importer.getRepoPullRequests(owner, repoName, 'all', 50);
      step = 'prs';
    } catch (error) {
      toast.error('Failed to fetch pull requests');
      console.error(error);
    } finally {
      loading = false;
    }
  }

  async function selectPullRequest(pr: PullRequest) {
    selectedPr = pr;
    loading = true;

    try {
      if (!importer || !selectedRepo) throw new Error('Missing data');
      const [owner, repoName] = selectedRepo.full_name.split('/');

      // Get diff content
      const diff = await importer.getPullRequestDiff(owner, repoName, pr.number);
      
      // Get files to detect language
      const files = await importer.getPullRequestFiles(owner, repoName, pr.number);
      
      // Detect primary language from most changed file
      let language = 'text';
      if (files.length > 0) {
        const mainFile = files.sort((a, b) => b.changes - a.changes)[0];
        const ext = mainFile.filename.split('.').pop()?.toLowerCase();
        
        const langMap: Record<string, string> = {
          js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
          py: 'python', rb: 'ruby', java: 'java', go: 'go', rs: 'rust',
          cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', swift: 'swift',
          kt: 'kotlin', scala: 'scala', html: 'html', css: 'css', scss: 'scss'
        };
        
        language = langMap[ext || ''] || 'text';
      }

      // Call import callback
      onImport({
        title: pr.title,
        code: diff,
        language,
        prUrl: pr.html_url
      });

      toast.success('Pull request imported successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to import pull request');
      console.error(error);
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    open = false;
    onClose();
    // Reset state after animation
    setTimeout(() => {
      step = 'check';
      repositories = [];
      pullRequests = [];
      selectedRepo = null;
      selectedPr = null;
      searchQuery = '';
      checkingConnection = true;
    }, 300);
  }

  function goBack() {
    if (step === 'prs') {
      step = 'repos';
      selectedRepo = null;
      pullRequests = [];
      searchQuery = '';
    } else if (step === 'repos') {
      step = 'connect';
      repositories = [];
      searchQuery = '';
    }
  }

  function goToSettings() {
    handleClose();
    window.location.href = '/settings/integrations';
  }
</script>

<Dialog bind:open>
  <DialogContent class="max-w-2xl max-h-[80vh]">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Github class="h-5 w-5" />
        Import from GitHub
        {#if connectedAccount}
          <Badge variant="secondary" class="ml-auto">
            Connected as {connectedAccount.username}
          </Badge>
        {/if}
      </DialogTitle>
      <DialogDescription>
        {#if step === 'check'}
          Checking your GitHub connection...
        {:else if step === 'connect'}
          Connect your GitHub account to import pull requests
        {:else if step === 'auth'}
          Enter your GitHub access token to import pull requests
        {:else if step === 'repos'}
          Select a repository to import from
        {:else if step === 'prs'}
          Select a pull request to import
        {/if}
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-4">
      {#if step === 'check'}
        <div class="py-12 text-center">
          <div class="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p class="mt-4 text-sm text-muted-foreground">Checking GitHub connection...</p>
        </div>
      {:else if step === 'connect'}
        <div class="space-y-4">
          <div class="text-center py-8">
            <Github class="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
            <h3 class="mt-4 text-lg font-medium">Connect GitHub</h3>
            <p class="mt-2 text-sm text-muted-foreground">
              Connect your GitHub account in settings to import pull requests
            </p>
          </div>
          
          <div class="flex gap-2">
            <Button onclick={goToSettings} class="flex-1">
              <Settings class="mr-2 h-4 w-4" />
              Go to Settings
            </Button>
            <Button variant="outline" onclick={handleClose}>Cancel</Button>
          </div>
        </div>
      {:else if step === 'auth'}
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="token">GitHub Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              bind:value={accessToken}
              onkeydown={(e) => e.key === 'Enter' && handleAuth()}
            />
            <p class="text-xs text-muted-foreground">
              Generate a token at <a href="https://github.com/settings/tokens" target="_blank" class="underline">GitHub Settings</a>
              with <code>repo</code> scope
            </p>
          </div>

          <div class="flex gap-2">
            <Button onclick={handleAuth} disabled={loading} class="flex-1">
              {loading ? 'Connecting...' : 'Connect to GitHub'}
            </Button>
            <Button variant="outline" onclick={handleClose}>Cancel</Button>
          </div>
        </div>
      {:else if step === 'repos'}
        <div class="space-y-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              bind:value={searchQuery}
              class="pl-9"
            />
          </div>

          <ScrollArea class="h-[400px] pr-4">
            {#if loading}
              {#each Array(5) as _}
                <div class="space-y-2 p-3">
                  <Skeleton class="h-4 w-3/4" />
                  <Skeleton class="h-3 w-1/2" />
                </div>
              {/each}
            {:else if filteredRepos.length === 0}
              <div class="py-12 text-center text-muted-foreground">
                <Github class="mx-auto h-12 w-12 opacity-20" />
                <p class="mt-2">No repositories found</p>
              </div>
            {:else}
              <div class="space-y-2">
                {#each filteredRepos as repo (repo.id)}
                  <button
                    onclick={() => selectRepository(repo)}
                    class="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div class="space-y-1">
                        <div class="font-medium">{repo.full_name}</div>
                        {#if repo.description}
                          <p class="text-sm text-muted-foreground">{repo.description}</p>
                        {/if}
                      </div>
                      {#if repo.private}
                        <Badge variant="secondary">Private</Badge>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </ScrollArea>

          <div class="flex gap-2">
            <Button variant="outline" onclick={goBack}>Back</Button>
            <Button variant="outline" onclick={handleClose} class="flex-1">Cancel</Button>
          </div>
        </div>
      {:else if step === 'prs'}
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Github class="h-4 w-4" />
            {selectedRepo?.full_name}
          </div>

          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search pull requests..."
              bind:value={searchQuery}
              class="pl-9"
            />
          </div>

          <ScrollArea class="h-[400px] pr-4">
            {#if loading}
              {#each Array(5) as _}
                <div class="space-y-2 p-3">
                  <Skeleton class="h-4 w-3/4" />
                  <Skeleton class="h-3 w-1/2" />
                </div>
              {/each}
            {:else if filteredPrs.length === 0}
              <div class="py-12 text-center text-muted-foreground">
                <GitPullRequest class="mx-auto h-12 w-12 opacity-20" />
                <p class="mt-2">No pull requests found</p>
              </div>
            {:else}
              <div class="space-y-2">
                {#each filteredPrs as pr (pr.number)}
                  <button
                    onclick={() => selectPullRequest(pr)}
                    class="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div class="space-y-2">
                      <div class="flex items-start gap-2">
                        <GitPullRequest class="h-4 w-4 mt-0.5 shrink-0" />
                        <div class="flex-1 space-y-1">
                          <div class="font-medium">{pr.title}</div>
                          <div class="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>#{pr.number}</span>
                            <span>•</span>
                            <span>{pr.user.login}</span>
                            <span>•</span>
                            <Badge variant={pr.state === 'open' ? 'default' : 'secondary'} class="text-xs">
                              {pr.state}
                            </Badge>
                          </div>
                          <div class="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{pr.head.ref}</span>
                            <span>→</span>
                            <span>{pr.base.ref}</span>
                          </div>
                        </div>
                        <a
                          href={pr.html_url}
                          target="_blank"
                          onclick={(e) => e.stopPropagation()}
                          class="p-1 hover:bg-background rounded"
                        >
                          <ExternalLink class="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </ScrollArea>

          <div class="flex gap-2">
            <Button variant="outline" onclick={goBack} disabled={loading}>Back</Button>
            <Button variant="outline" onclick={handleClose} class="flex-1">Cancel</Button>
          </div>
        </div>
      {/if}
    </div>
  </DialogContent>
</Dialog>
