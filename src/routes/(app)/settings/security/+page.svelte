<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { Shield, Key, Trash2, AlertTriangle } from 'lucide-svelte';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);

	let twoFactorEnabled = $state(false);
	let isSettingUp2FA = $state(false);

	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');

	async function handleChangePassword() {
		if (!currentPassword || !newPassword || !confirmPassword) {
			toast.error('All password fields are required');
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error('New passwords do not match');
			return;
		}

		if (newPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return;
		}

		isChangingPassword = true;
		try {
			// TODO: Call API to change password
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success('Password changed successfully');
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (error) {
			toast.error('Failed to change password');
		} finally {
			isChangingPassword = false;
		}
	}

	async function handleSetup2FA() {
		isSettingUp2FA = true;
		try {
			// TODO: Call API to setup 2FA
			await new Promise((resolve) => setTimeout(resolve, 1000));
			twoFactorEnabled = !twoFactorEnabled;
			toast.success(twoFactorEnabled ? '2FA enabled' : '2FA disabled');
		} catch (error) {
			toast.error('Failed to update 2FA settings');
		} finally {
			isSettingUp2FA = false;
		}
	}

	async function handleDeleteAccount() {
		if (deleteConfirmText !== 'DELETE') {
			toast.error('Please type DELETE to confirm');
			return;
		}

		try {
			// TODO: Call API to delete account
			toast.success('Account deletion initiated. You will receive a confirmation email.');
			showDeleteConfirm = false;
		} catch (error) {
			toast.error('Failed to delete account');
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold">Security Settings</h2>
		<p class="text-muted-foreground mt-2">Manage your account security and authentication</p>
	</div>

	<!-- Change Password -->
	<div class="rounded-lg border p-6 space-y-4">
		<div class="flex items-center gap-2">
			<Key class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-semibold">Change Password</h3>
		</div>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="current-password">Current Password</Label>
				<Input
					id="current-password"
					type="password"
					bind:value={currentPassword}
					autocomplete="current-password"
				/>
			</div>

			<div class="space-y-2">
				<Label for="new-password">New Password</Label>
				<Input
					id="new-password"
					type="password"
					bind:value={newPassword}
					autocomplete="new-password"
				/>
			</div>

			<div class="space-y-2">
				<Label for="confirm-password">Confirm New Password</Label>
				<Input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					autocomplete="new-password"
				/>
			</div>

			<Button onclick={handleChangePassword} disabled={isChangingPassword}>
				{isChangingPassword ? 'Changing...' : 'Change Password'}
			</Button>
		</div>
	</div>

	<!-- Two-Factor Authentication -->
	<div class="rounded-lg border p-6 space-y-4">
		<div class="flex items-center gap-2">
			<Shield class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-semibold">Two-Factor Authentication</h3>
		</div>

		<p class="text-sm text-muted-foreground">
			Add an extra layer of security to your account by requiring a verification code in addition
			to your password.
		</p>

		<div class="flex items-center justify-between">
			<div>
				<p class="font-medium">
					Status: <span class={twoFactorEnabled ? 'text-green-600' : 'text-muted-foreground'}>
						{twoFactorEnabled ? 'Enabled' : 'Disabled'}
					</span>
				</p>
			</div>
			<Button onclick={handleSetup2FA} disabled={isSettingUp2FA} variant="outline">
				{isSettingUp2FA
					? 'Processing...'
					: twoFactorEnabled
						? 'Disable 2FA'
						: 'Enable 2FA'}
			</Button>
		</div>
	</div>

	<!-- Danger Zone -->
	<div class="rounded-lg border border-destructive p-6 space-y-4">
		<div class="flex items-center gap-2">
			<AlertTriangle class="h-5 w-5 text-destructive" />
			<h3 class="text-lg font-semibold text-destructive">Danger Zone</h3>
		</div>

		{#if !showDeleteConfirm}
			<div class="space-y-2">
				<p class="text-sm text-muted-foreground">
					Once you delete your account, there is no going back. This action cannot be undone.
				</p>
				<Button variant="destructive" onclick={() => (showDeleteConfirm = true)}>
					<Trash2 class="h-4 w-4 mr-2" />
					Delete Account
				</Button>
			</div>
		{:else}
			<div class="space-y-4">
				<p class="text-sm font-medium">
					Are you sure? This will permanently delete your account and all associated data.
				</p>
				<div class="space-y-2">
					<Label for="delete-confirm">Type "DELETE" to confirm</Label>
					<Input id="delete-confirm" bind:value={deleteConfirmText} placeholder="DELETE" />
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (showDeleteConfirm = false)}>Cancel</Button>
					<Button variant="destructive" onclick={handleDeleteAccount}>
						Confirm Deletion
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
