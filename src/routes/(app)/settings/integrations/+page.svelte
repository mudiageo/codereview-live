<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Github from '@lucide/svelte/icons/github';
	import GitlabIcon from '@lucide/svelte/icons/gitlab';
	import Chrome from '@lucide/svelte/icons/chrome';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	interface ConnectedAccount {
		id: string;
		provider: 'github' | 'gitlab' | 'google';
		username: string;
		email: string;
		avatar_url?: string;
		connected_at: string;
	}

	let connectedAccounts = $state<ConnectedAccount[]>([]);
	let loading = $state(false);
	let connectingProvider = $state<string | null>(null);

	onMount(() => {
		loadConnectedAccounts();
	});

	async function loadConnectedAccounts() {
		try {
			const response = await fetch('/api/oauth/connected');
			if (response.ok) {
				connectedAccounts = await response.json();
			}
		} catch (error) {
			console.error('Failed to load connected accounts:', error);
		}
	}

	async function connectProvider(provider: 'github' | 'gitlab' | 'google') {
		connectingProvider = provider;
		loading = true;

		try {
			// Start OAuth flow
			const response = await fetch(`/api/oauth/authorize?provider=${provider}`);
			if (response.ok) {
				const { authUrl } = await response.json();
				window.location.href = authUrl;
			} else {
				toast.error(`Failed to initiate ${provider} connection`);
			}
		} catch (error) {
			toast.error(`Error connecting to ${provider}`);
			console.error(error);
		} finally {
			loading = false;
			connectingProvider = null;
		}
	}

	async function disconnectProvider(accountId: string, provider: string) {
		loading = true;
		try {
			const response = await fetch('/api/oauth/disconnect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accountId })
			});

			if (response.ok) {
				toast.success(`${provider} disconnected successfully`);
				await loadConnectedAccounts();
			} else {
				toast.error(`Failed to disconnect ${provider}`);
			}
		} catch (error) {
			toast.error('Error disconnecting account');
			console.error(error);
		} finally {
			loading = false;
		}
	}

	function isConnected(provider: string) {
		return connectedAccounts.some((acc) => acc.provider === provider);
	}

	function getConnectedAccount(provider: string) {
		return connectedAccounts.find((acc) => acc.provider === provider);
	}

	const providers = [
		{
			id: 'github',
			name: 'GitHub',
			icon: Github,
			description: 'Import pull requests and code from GitHub repositories',
			color: 'bg-gray-900 dark:bg-gray-100'
		},
		{
			id: 'gitlab',
			name: 'GitLab',
			icon: GitlabIcon,
			description: 'Import merge requests and code from GitLab repositories',
			color: 'bg-orange-500'
		},
		{
			id: 'google',
			name: 'Google',
			icon: Chrome,
			description: 'Connect your Google account for easy sign-in',
			color: 'bg-blue-500'
		}
	];
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Integrations</h1>
		<p class="text-muted-foreground">
			Connect external services to import code and enhance your workflow
		</p>
	</div>

	<div class="grid gap-4">
		{#each providers as provider}
			{@const connected = isConnected(provider.id)}
			{@const account = getConnectedAccount(provider.id)}

			<Card>
				<CardHeader>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg {provider.color} text-white">
								<svelte:component this={provider.icon} class="h-5 w-5" />
							</div>
							<div>
								<CardTitle>{provider.name}</CardTitle>
								<CardDescription>{provider.description}</CardDescription>
							</div>
						</div>

						{#if connected}
							<Badge variant="outline" class="flex items-center gap-1">
								<CheckCircle class="h-3 w-3 text-green-600" />
								Connected
							</Badge>
						{:else}
							<Badge variant="outline" class="flex items-center gap-1">
								<XCircle class="h-3 w-3 text-gray-400" />
								Not Connected
							</Badge>
						{/if}
					</div>
				</CardHeader>

				<CardContent>
					{#if connected && account}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								{#if account.avatar_url}
									<img
										src={account.avatar_url}
										alt={account.username}
										class="h-10 w-10 rounded-full"
									/>
								{/if}
								<div>
									<p class="font-medium">{account.username}</p>
									<p class="text-sm text-muted-foreground">{account.email}</p>
									<p class="text-xs text-muted-foreground">
										Connected {new Date(account.connected_at).toLocaleDateString()}
									</p>
								</div>
							</div>

							<Button
								variant="destructive"
								size="sm"
								onclick={() => disconnectProvider(account.id, provider.name)}
								disabled={loading}
							>
								{#if loading}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								{/if}
								Disconnect
							</Button>
						</div>
					{:else}
						<Button
							onclick={() => connectProvider(provider.id as any)}
							disabled={loading}
							class="w-full sm:w-auto"
						>
							{#if connectingProvider === provider.id}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<svelte:component this={provider.icon} class="mr-2 h-4 w-4" />
							{/if}
							Connect {provider.name}
						</Button>
					{/if}
				</CardContent>
			</Card>
		{/each}
	</div>

	<Card>
		<CardHeader>
			<CardTitle>About Integrations</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div>
				<h4 class="font-medium mb-2">GitHub</h4>
				<p class="text-sm text-muted-foreground">
					Connect GitHub to import pull requests directly into CodeReview.live. All private repositories
					are supported with proper authentication.
				</p>
			</div>
			<div>
				<h4 class="font-medium mb-2">GitLab</h4>
				<p class="text-sm text-muted-foreground">
					Import merge requests from GitLab.com or your self-hosted GitLab instance. Works with both
					public and private repositories.
				</p>
			</div>
			<div>
				<h4 class="font-medium mb-2">Google</h4>
				<p class="text-sm text-muted-foreground">
					Use Google for quick authentication and to sync your preferences across devices.
				</p>
			</div>
			<div class="pt-4 border-t">
				<p class="text-sm text-muted-foreground">
					<strong>Privacy:</strong> We only request the minimum permissions needed. Your tokens are encrypted
					and stored securely. You can disconnect any integration at any time.
				</p>
			</div>
		</CardContent>
	</Card>
</div>
