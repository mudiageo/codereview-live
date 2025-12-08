import { browser } from '$app/environment';
import type { Subscription } from '$lib/server/db/schema';
import type { PlanId } from '$lib/config/plans';
import { plans } from '$lib/config/plans';

class SubscriptionStore {
	subscription = $state<Subscription | null>(null);
	isLoading = $state(false);
	error = $state<Error | null>(null);

	get currentPlan(): PlanId {
		return (this.subscription?.plan as PlanId) || 'free';
	}

	get planDetails() {
		return plans[this.currentPlan];
	}

	get isActive(): boolean {
		return this.subscription?.status === 'active';
	}

	get isCancelled(): boolean {
		return this.subscription?.cancelAtPeriodEnd === true;
	}

	get currentPeriodEnd(): Date | null {
		return this.subscription?.currentPeriodEnd || null;
	}

	get limits() {
		return this.planDetails.limits;
	}

	get features() {
		return this.planDetails.features;
	}

	// Usage tracking
	usage = $state({
		reviews: 0,
		projects: 0,
		storage: 0,
		aiCredits: 0,
		teamMembers: 0
	});

	get canCreateReview(): boolean {
		const limit = this.limits.localReviews;
		return limit === -1 || this.usage.reviews < limit;
	}

	get canUploadVideo(): boolean {
		// Check storage limit
		const limitBytes = this.parseStorageLimit(this.limits.storage);
		return this.usage.storage < limitBytes;
	}

	get canUseAI(): boolean {
		const limit = this.limits.aiCredits;
		return this.usage.aiCredits < limit;
	}

	get canAddTeamMember(): boolean {
		const limit = this.limits.teamMembers;
		return this.usage.teamMembers < limit;
	}

	private parseStorageLimit(limit: string): number {
		// Parse storage limits like "1GB", "50GB", "200GB"
		const match = limit.match(/(\d+)(GB|MB)/);
		if (!match) return 0;

		const value = parseInt(match[1]);
		const unit = match[2];

		return unit === 'GB' ? value * 1024 * 1024 * 1024 : value * 1024 * 1024;
	}

	async load() {
		if (!browser) return;

		this.isLoading = true;
		this.error = null;

		try {
			// TODO: Fetch subscription from API
			// For now, this would need to be populated by the server
			console.log('Loading subscription...');
		} catch (err) {
			this.error = err as Error;
			console.error('Failed to load subscription:', err);
		} finally {
			this.isLoading = false;
		}
	}

	updateUsage(usage: Partial<typeof this.usage>) {
		this.usage = { ...this.usage, ...usage };
	}

	updateSubscription(subscription: Subscription) {
		this.subscription = subscription;
	}

	reset() {
		this.subscription = null;
		this.usage = {
			reviews: 0,
			projects: 0,
			storage: 0,
			aiCredits: 0,
			teamMembers: 0
		};
	}
}

export const subscriptionStore = new SubscriptionStore();
