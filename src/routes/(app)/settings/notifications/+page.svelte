<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
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
				<Switch
					id="email-comments"
					checked={emailNotifications.reviewComments}
					onCheckedChange={(checked) => emailNotifications.reviewComments = checked}
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="email-mentions" class="cursor-pointer">Mentions</Label>
				<Switch
					id="email-mentions"
					checked={emailNotifications.mentions}
					onCheckedChange={(checked) => emailNotifications.mentions = checked}
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="email-digest" class="cursor-pointer">Weekly Digest</Label>
				<Switch
					id="email-digest"
					checked={emailNotifications.weeklyDigest}
					onCheckedChange={(checked) => emailNotifications.weeklyDigest = checked}
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label for="email-new" class="cursor-pointer">New Review Assigned</Label>
				<Switch
					id="email-new"
					checked={emailNotifications.newReview}
					onCheckedChange={(checked) => emailNotifications.newReview = checked}
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
				<Switch
					id="push-enabled"
					checked={pushNotifications.enabled}
					onCheckedChange={(checked) => pushNotifications.enabled = checked}
				/>
			</div>

			{#if pushNotifications.enabled}
				<div class="flex items-center justify-between">
					<Label for="push-comments" class="cursor-pointer">Review Comments</Label>
					<Switch
						id="push-comments"
						checked={pushNotifications.reviewComments}
						onCheckedChange={(checked) => pushNotifications.reviewComments = checked}
					/>
				</div>

				<div class="flex items-center justify-between">
					<Label for="push-mentions" class="cursor-pointer">Mentions</Label>
					<Switch
						id="push-mentions"
						checked={pushNotifications.mentions}
						onCheckedChange={(checked) => pushNotifications.mentions = checked}
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
				<Switch
					id="inapp-enabled"
					checked={inAppNotifications.enabled}
					onCheckedChange={(checked) => inAppNotifications.enabled = checked}
				/>
			</div>

			{#if inAppNotifications.enabled}
				<div class="flex items-center justify-between">
					<Label for="inapp-sound" class="cursor-pointer">Sound Alerts</Label>
					<Switch
						id="inapp-sound"
						checked={inAppNotifications.sound}
						onCheckedChange={(checked) => inAppNotifications.sound = checked}
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
