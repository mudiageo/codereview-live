import type { PlanId } from './plans';

export const featureFlags = {
	cloudSync: {
		enabled: true,
		allowedPlans: ['pro', 'team'] as PlanId[]
	},
	aiFeatures: {
		enabled: true,
		allowedPlans: ['free', 'pro', 'team'] as PlanId[]
	},
	advancedAI: {
		enabled: true,
		allowedPlans: ['pro', 'team'] as PlanId[]
	},
	teamCollaboration: {
		enabled: true,
		allowedPlans: ['team'] as PlanId[]
	},
	analytics: {
		enabled: true,
		allowedPlans: ['team'] as PlanId[]
	},
	prioritySupport: {
		enabled: true,
		allowedPlans: ['pro', 'team'] as PlanId[]
	},
	sso: {
		enabled: true,
		allowedPlans: ['team'] as PlanId[]
	}
};

export const planLimits = {
	free: {
		maxReviews: 10,
		maxProjects: 5,
		maxStorageBytes: 1024 * 1024 * 1024, // 1GB
		aiCreditsPerMonth: 50,
		maxTeamMembers: 1
	},
	pro: {
		maxReviews: -1, // unlimited
		maxProjects: -1,
		maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50GB
		aiCreditsPerMonth: 1000,
		maxTeamMembers: 1
	},
	team: {
		maxReviews: -1,
		maxProjects: -1,
		maxStorageBytes: 200 * 1024 * 1024 * 1024, // 200GB
		aiCreditsPerMonth: 5000,
		maxTeamMembers: 10
	}
};

export function hasFeatureAccess(userPlan: PlanId, feature: keyof typeof featureFlags): boolean {
	const flag = featureFlags[feature];
	return flag.enabled && flag.allowedPlans.includes(userPlan);
}

export function getLimit(userPlan: PlanId, limitKey: keyof (typeof planLimits)['free']): number {
	return planLimits[userPlan][limitKey];
}

export function isWithinLimit(
	currentValue: number,
	limit: number
): boolean {
	return limit === -1 || currentValue < limit;
}

// Alternative signature for plan-based checks
export function isPlanWithinLimit(
	userPlan: PlanId,
	limitKey: keyof (typeof planLimits)['free'],
	currentValue: number
): boolean {
	const limit = getLimit(userPlan, limitKey);
	return limit === -1 || currentValue < limit;
}
