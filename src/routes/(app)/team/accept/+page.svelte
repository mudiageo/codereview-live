<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { joinTeam } from '$lib/team.remote';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
    import Loader2 from '@lucide/svelte/icons/loader-2';

	let status = $state<'processing' | 'success' | 'error'>('processing');
	let message = $state('Verifying invitation...');

	onMount(async () => {
		const token = page.url.searchParams.get('token');
		if (!token) {
			status = 'error';
			message = 'Invalid invitation link.';
			return;
		}

		try {
			await joinTeam({ token });
			status = 'success';
			message = 'Successfully joined the team!';
			toast.success('You have joined the team!');
			setTimeout(() => {
				goto('/team');
			}, 2000);
		} catch (e: any) {
			console.error(e);
			status = 'error';
			message = e.message || 'Failed to accept invitation.';
			toast.error(message);
		}
	});
</script>

<div class="flex items-center justify-center min-h-[60vh]">
	<div class="text-center space-y-4 max-w-md mx-auto p-6 border rounded-lg bg-card">
		{#if status === 'processing'}
            <div class="flex flex-col items-center">
			    <Loader2 class="h-10 w-10 animate-spin text-primary mb-4" />
			    <h2 class="text-xl font-semibold">Joining Team...</h2>
			    <p class="text-muted-foreground">{message}</p>
            </div>
		{:else if status === 'success'}
            <div class="flex flex-col items-center">
			    <div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600 dark:text-green-400 text-2xl">✓</div>
			    <h2 class="text-xl font-semibold">Welcome Aboard!</h2>
			    <p class="text-muted-foreground">{message}</p>
                <p class="text-sm mt-4">Redirecting you to the team dashboard...</p>
            </div>
		{:else}
            <div class="flex flex-col items-center">
                <div class="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 text-2xl">✕</div>
			    <h2 class="text-xl font-semibold text-destructive">Invitation Failed</h2>
			    <p class="text-muted-foreground">{message}</p>
                <button class="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium" onclick={() => goto('/dashboard')}>Go to Dashboard</button>
            </div>
		{/if}
	</div>
</div>
