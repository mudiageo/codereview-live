<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { teamsStore, teamInvitationsStore } from '$lib/stores/index.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { hasFeatureAccess } from '$lib/config';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Mail from '@lucide/svelte/icons/mail';
	import { onMount } from 'svelte';

	const userPlan = $derived(auth.currentUser?.plan || 'free');
	const hasTeamAccess = $derived(hasFeatureAccess(userPlan as any, 'teamCollaboration'));

	let newMemberEmail = $state('');
	let newMemberRole = $state('member');
	let isInviting = $state(false);

	onMount(async () => {
		if (hasTeamAccess) {
			await teamsStore.load();
			await teamInvitationsStore.load();
		}
	});

	async function handleInvite() {
		if (!newMemberEmail) {
			toast.error('Email is required');
			return;
		}

		isInviting = true;
		try {
			const currentTeam = teamsStore.current;
			if (!currentTeam || !auth.currentUser) {
				toast.error('No team found');
				return;
			}

			await teamInvitationsStore.create({
				teamId: currentTeam.id,
				email: newMemberEmail,
				role: newMemberRole,
				invitedBy: auth.currentUser.id,
				token: crypto.randomUUID(),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
			});

			toast.success('Invitation sent!');
			newMemberEmail = '';
		} catch (error) {
			toast.error('Failed to send invitation');
		} finally {
			isInviting = false;
		}
	}

	async function cancelInvitation(invitationId: string) {
		try {
			await teamInvitationsStore.delete(invitationId);
			toast.success('Invitation cancelled');
		} catch (error) {
			toast.error('Failed to cancel invitation');
		}
	}
</script>

{#if !hasTeamAccess}
	<div class="space-y-6">
		<div>
			<h2 class="text-2xl font-bold">Team Management</h2>
			<p class="text-muted-foreground mt-2">Collaborate with your team</p>
		</div>

		<div class="rounded-lg border border-dashed p-8 text-center">
			<h3 class="text-lg font-semibold mb-2">Team Features Not Available</h3>
			<p class="text-muted-foreground mb-4">
				Upgrade to the Team plan to enable team collaboration features
			</p>
			<Button onclick={() => (window.location.href = '/settings/billing')}>
				Upgrade to Team Plan
			</Button>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<div>
			<h2 class="text-2xl font-bold">Team Management</h2>
			<p class="text-muted-foreground mt-2">Manage your team members and invitations</p>
		</div>

		<!-- Invite New Member -->
		<div class="rounded-lg border p-6 space-y-4">
			<div class="flex items-center gap-2">
				<UserPlus class="h-5 w-5 text-primary" />
				<h3 class="text-lg font-semibold">Invite Team Member</h3>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						placeholder="colleague@example.com"
						bind:value={newMemberEmail}
					/>
				</div>

				<div class="space-y-2">
					<Label for="role">Role</Label>
					<Select id="role" bind:value={newMemberRole} class="w-full rounded-md border p-2">
					<SelectTrigger>
            {newMemberRole || ""}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
					</Select>
 
				</div>
			</div>

			<Button onclick={handleInvite} disabled={isInviting}>
				<Mail class="h-4 w-4 mr-2" />
				{isInviting ? 'Sending...' : 'Send Invitation'}
			</Button>
		</div>

		<!-- Pending Invitations -->
		{#if teamInvitationsStore.pending.length > 0}
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Pending Invitations</h3>
				<div class="space-y-2">
					{#each teamInvitationsStore.pending as invitation}
						<div class="flex items-center justify-between p-4 rounded-lg border">
							<div>
								<p class="font-medium">{invitation.email}</p>
								<p class="text-sm text-muted-foreground">
									Role: {invitation.role} • Expires: {new Date(
										invitation.expiresAt
									).toLocaleDateString()}
								</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => cancelInvitation(invitation.id)}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
