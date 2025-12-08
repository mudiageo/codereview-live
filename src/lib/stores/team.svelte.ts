import { browser } from '$app/environment';
import type { Team, TeamMember, TeamInvitation } from '$lib/server/db/schema';

class TeamStore {
	team = $state<Team | null>(null);
	members = $state<TeamMember[]>([]);
	invitations = $state<TeamInvitation[]>([]);
	isLoading = $state(false);
	error = $state<Error | null>(null);

	get memberCount(): number {
		return this.members.length;
	}

	get canAddMember(): boolean {
		if (!this.team) return false;
		return this.members.length < this.team.maxMembers;
	}

	get pendingInvitations(): TeamInvitation[] {
		return this.invitations.filter((inv) => {
			return new Date(inv.expiresAt) > new Date();
		});
	}

	get expiredInvitations(): TeamInvitation[] {
		return this.invitations.filter((inv) => {
			return new Date(inv.expiresAt) <= new Date();
		});
	}

	async load() {
		if (!browser) return;

		this.isLoading = true;
		this.error = null;

		try {
			// TODO: Fetch team data from API
			console.log('Loading team...');
		} catch (err) {
			this.error = err as Error;
			console.error('Failed to load team:', err);
		} finally {
			this.isLoading = false;
		}
	}

	async inviteMember(email: string, role: string = 'member') {
		if (!browser) return;

		try {
			// TODO: API call to invite member
			console.log('Inviting member:', email, role);
		} catch (err) {
			this.error = err as Error;
			throw err;
		}
	}

	async removeMember(memberId: string) {
		if (!browser) return;

		try {
			// TODO: API call to remove member
			this.members = this.members.filter((m) => m.id !== memberId);
		} catch (err) {
			this.error = err as Error;
			throw err;
		}
	}

	async updateMemberRole(memberId: string, role: string) {
		if (!browser) return;

		try {
			// TODO: API call to update member role
			this.members = this.members.map((m) =>
				m.id === memberId ? { ...m, role } : m
			);
		} catch (err) {
			this.error = err as Error;
			throw err;
		}
	}

	async cancelInvitation(invitationId: string) {
		if (!browser) return;

		try {
			// TODO: API call to cancel invitation
			this.invitations = this.invitations.filter((inv) => inv.id !== invitationId);
		} catch (err) {
			this.error = err as Error;
			throw err;
		}
	}

	async resendInvitation(invitationId: string) {
		if (!browser) return;

		try {
			// TODO: API call to resend invitation
			console.log('Resending invitation:', invitationId);
		} catch (err) {
			this.error = err as Error;
			throw err;
		}
	}

	getMember(userId: string): TeamMember | undefined {
		return this.members.find((m) => m.userId === userId);
	}

	isMember(userId: string): boolean {
		return this.members.some((m) => m.userId === userId);
	}

	isOwner(userId: string): boolean {
		if (!this.team) return false;
		return this.team.ownerId === userId;
	}

	isAdmin(userId: string): boolean {
		const member = this.getMember(userId);
		return member?.role === 'admin' || this.isOwner(userId);
	}

	reset() {
		this.team = null;
		this.members = [];
		this.invitations = [];
	}
}

export const teamStore = new TeamStore();
