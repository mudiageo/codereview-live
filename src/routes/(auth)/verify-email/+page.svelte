<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { toast } from 'svelte-sonner';

	let status = $state<'verifying' | 'success' | 'error'>('verifying');
	let message = $state('Verifying your email...');

	onMount(async () => {
		const token = $page.url.searchParams.get('token');

		if (!token) {
			status = 'error';
			message = 'Verification token is missing';
			return;
		}

		try {
			const response = await fetch('/api/auth/verify-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const data = await response.json();

			if (response.ok) {
				status = 'success';
				message = 'Your email has been successfully verified!';

				// Redirect to dashboard after 2 seconds
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			} else {
				status = 'error';
				message = data.error || 'Verification failed. The link may have expired.';
			}
		} catch (error) {
			console.error('Verification error:', error);
			status = 'error';
			message = 'An error occurred during verification. Please try again.';
		}
	});

	async function resendVerification() {
		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				toast.success('Verification email sent! Please check your inbox.');
			} else {
				const data = await response.json();
				toast.error(data.error || 'Failed to resend verification email');
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.');
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
	<div class="max-w-md w-full space-y-8 text-center">
		<div class="flex justify-center">
			{#if status === 'verifying'}
				<Loader2 class="h-16 w-16 text-primary animate-spin" />
			{:else if status === 'success'}
				<CheckCircle class="h-16 w-16 text-green-500" />
			{:else}
				<XCircle class="h-16 w-16 text-destructive" />
			{/if}
		</div>

		<div class="space-y-2">
			<h1 class="text-3xl font-bold">
				{#if status === 'verifying'}
					Verifying Email
				{:else if status === 'success'}
					Email Verified!
				{:else}
					Verification Failed
				{/if}
			</h1>
			<p class="text-muted-foreground">{message}</p>
		</div>

		{#if status === 'success'}
			<p class="text-sm text-muted-foreground">Redirecting to dashboard...</p>
		{/if}

		{#if status === 'error'}
			<div class="space-y-3 pt-4">
				<Button onclick={resendVerification} variant="outline" class="w-full">
					Resend Verification Email
				</Button>
				<Button onclick={() => goto('/login')} variant="ghost" class="w-full">
					Back to Login
				</Button>
			</div>
		{/if}
	</div>
</div>
