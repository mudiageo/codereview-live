<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import Shield from '@lucide/svelte/icons/shield';
	import Key from '@lucide/svelte/icons/key';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import { authClient } from '$lib/auth-client';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);

	let twoFactorEnabled = $state(false);
	let isSettingUp2FA = $state(false);
	let qrCode = $state('');
	let totpUri = $state('');
	let verificationCode = $state('');
	let showQRCode = $state(false);

	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');
	
	// Check 2FA status on mount
	onMount(async () => {
		try {
			const session = await authClient.getSession();
			if (session.data?.user) {
				// Check if user has 2FA enabled
				twoFactorEnabled = session.data.user.twoFactorEnabled || false;
			}
		} catch (error) {
			console.error('Failed to check 2FA status:', error);
		}
	});

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
			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			
			if (result.error) {
				toast.error(result.error.message || 'Failed to change password');
			} else {
				toast.success('Password changed successfully');
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to change password');
		} finally {
			isChangingPassword = false;
		}
	}

	async function handleEnable2FA() {
		isSettingUp2FA = true;
		try {
			const result = await authClient.twoFactor.enable({
				password: currentPassword,
			});
			
			if (result.error) {
				toast.error(result.error.message || 'Failed to enable 2FA');
				return;
			}
			
			if (result.data) {
				qrCode = result.data.qrCode;
				totpUri = result.data.totpUri;
				showQRCode = true;
				toast.info('Scan the QR code with your authenticator app');
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to enable 2FA');
		} finally {
			isSettingUp2FA = false;
		}
	}
	
	async function handleVerify2FA() {
		if (!verificationCode || verificationCode.length !== 6) {
			toast.error('Please enter a valid 6-digit code');
			return;
		}
		
		try {
			const result = await authClient.twoFactor.verify({
				code: verificationCode,
			});
			
			if (result.error) {
				toast.error(result.error.message || 'Invalid code');
				return;
			}
			
			twoFactorEnabled = true;
			showQRCode = false;
			verificationCode = '';
			currentPassword = '';
			toast.success('2FA enabled successfully');
		} catch (error: any) {
			toast.error(error.message || 'Failed to verify code');
		}
	}

	async function handleDisable2FA() {
		isSettingUp2FA = true;
		try {
			const result = await authClient.twoFactor.disable({
				password: currentPassword,
			});
			
			if (result.error) {
				toast.error(result.error.message || 'Failed to disable 2FA');
			} else {
				twoFactorEnabled = false;
				currentPassword = '';
				toast.success('2FA disabled');
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to disable 2FA');
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
			const result = await authClient.deleteUser();
			
			if (result.error) {
				toast.error(result.error.message || 'Failed to delete account');
				return;
			}
			
			toast.success('Account deletion initiated. You will receive a confirmation email.');
			showDeleteConfirm = false;
			
			// Sign out and redirect
			await auth.signOut();
			goto('/');
		} catch (error: any) {
			toast.error(error.message || 'Failed to delete account');
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

		{#if showQRCode}
			<div class="space-y-4 p-4 border rounded-lg bg-muted/20">
				<div class="text-center">
					<p class="font-medium mb-2">Scan this QR code with your authenticator app:</p>
					{#if qrCode}
						<div class="flex justify-center">
							<img src={qrCode} alt="2FA QR Code" class="max-w-xs" />
						</div>
					{/if}
					<p class="text-xs text-muted-foreground mt-2">Or enter this key manually:</p>
					<code class="text-sm bg-muted px-2 py-1 rounded">{totpUri}</code>
				</div>
				
				<div class="space-y-2">
					<Label for="verification-code">Enter Verification Code</Label>
					<Input
						id="verification-code"
						bind:value={verificationCode}
						placeholder="000000"
						maxlength="6"
					/>
				</div>
				
				<div class="flex gap-2">
					<Button onclick={handleVerify2FA}>Verify and Enable</Button>
					<Button variant="outline" onclick={() => { showQRCode = false; verificationCode = ''; }}>
						Cancel
					</Button>
				</div>
			</div>
		{:else}
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium">
						Status: <span class={twoFactorEnabled ? 'text-green-600' : 'text-muted-foreground'}>
							{twoFactorEnabled ? 'Enabled' : 'Disabled'}
						</span>
					</p>
				</div>
				
				{#if twoFactorEnabled}
					<div class="space-y-2">
						{#if !currentPassword}
							<p class="text-sm text-muted-foreground">Enter your password to disable 2FA</p>
							<Input
								type="password"
								bind:value={currentPassword}
								placeholder="Current password"
								autocomplete="current-password"
							/>
						{/if}
						<Button 
							onclick={handleDisable2FA} 
							disabled={isSettingUp2FA || !currentPassword} 
							variant="outline"
						>
							{isSettingUp2FA ? 'Processing...' : 'Disable 2FA'}
						</Button>
					</div>
				{:else}
					<div class="space-y-2">
						{#if !currentPassword}
							<p class="text-sm text-muted-foreground">Enter your password to enable 2FA</p>
							<Input
								type="password"
								bind:value={currentPassword}
								placeholder="Current password"
								autocomplete="current-password"
							/>
						{/if}
						<Button 
							onclick={handleEnable2FA} 
							disabled={isSettingUp2FA || !currentPassword} 
							variant="outline"
						>
							{isSettingUp2FA ? 'Processing...' : 'Enable 2FA'}
						</Button>
					</div>
				{/if}
			</div>
		{/if}
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
