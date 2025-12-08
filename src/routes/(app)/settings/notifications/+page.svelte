<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import Bell from '@lucide/svelte/icons/bell';
	import Mail from '@lucide/svelte/icons/mail';
	import MessageSquare from '@lucide/svelte/icons/message-square';

	let emailNotifications = $state({
		reviewComments: true,
		mentions: true,
		weeklyDigest: false,
		newReview: true
	});

	let pushNotifications = $state({
		enabled: false,
		reviewComments: true,
		mentions: true
	});

	let inAppNotifications = $state({
		enabled: true,
		sound: true
	});

	let isSaving = $state(false);

	async function handleSave() {
		isSaving = true;
		try {
			// TODO: Save to server
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success('Notification settings saved');
		} catch (error) {
			toast.error('Failed to save settings');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold">Notification Settings</h2>
		<p class="text-muted-foreground mt-2">Manage how you receive notifications</p>
	</div>

	<!-- Email Notifications -->
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Mail class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-semibold">Email Notifications</h3>
		</div>

		<div class="space-y-3 pl-7">
			<div class="flex items-center justify-between">
				<Label for="email-comments" class="cursor-pointer">Review Comments</Label>
				<input
					type="checkbox"
					id="email-comments"
					bind:checked={emailNotifications.reviewComments}
					class="rounded"
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="email-mentions" class="cursor-pointer">Mentions</Label>
				<input
					type="checkbox"
					id="email-mentions"
					bind:checked={emailNotifications.mentions}
					class="rounded"
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="email-digest" class="cursor-pointer">Weekly Digest</Label>
				<input
					type="checkbox"
					id="email-digest"
					bind:checked={emailNotifications.weeklyDigest}
					class="rounded"
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="email-new" class="cursor-pointer">New Review Assigned</Label>
				<input
					type="checkbox"
					id="email-new"
					bind:checked={emailNotifications.newReview}
					class="rounded"
				/>
			</div>
		</div>
	</div>

	<!-- Push Notifications -->
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Bell class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-semibold">Push Notifications</h3>
		</div>

		<div class="space-y-3 pl-7">
			<div class="flex items-center justify-between">
				<Label for="push-enabled" class="cursor-pointer">Enable Push Notifications</Label>
				<input
					type="checkbox"
					id="push-enabled"
					bind:checked={pushNotifications.enabled}
					class="rounded"
				/>
			</div>

			{#if pushNotifications.enabled}
				<div class="flex items-center justify-between">
					<Label for="push-comments" class="cursor-pointer">Review Comments</Label>
					<input
						type="checkbox"
						id="push-comments"
						bind:checked={pushNotifications.reviewComments}
						class="rounded"
					/>
				</div>

				<div class="flex items-center justify-between">
					<Label for="push-mentions" class="cursor-pointer">Mentions</Label>
					<input
						type="checkbox"
						id="push-mentions"
						bind:checked={pushNotifications.mentions}
						class="rounded"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- In-App Notifications -->
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<MessageSquare class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-semibold">In-App Notifications</h3>
		</div>

		<div class="space-y-3 pl-7">
			<div class="flex items-center justify-between">
				<Label for="inapp-enabled" class="cursor-pointer">Enable In-App Notifications</Label>
				<input
					type="checkbox"
					id="inapp-enabled"
					bind:checked={inAppNotifications.enabled}
					class="rounded"
				/>
			</div>

			{#if inAppNotifications.enabled}
				<div class="flex items-center justify-between">
					<Label for="inapp-sound" class="cursor-pointer">Sound Alerts</Label>
					<input
						type="checkbox"
						id="inapp-sound"
						bind:checked={inAppNotifications.sound}
						class="rounded"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Save Button -->
	<div class="pt-4">
		<Button onclick={handleSave} disabled={isSaving}>
			{isSaving ? 'Saving...' : 'Save Changes'}
		</Button>
	</div>
</div>
