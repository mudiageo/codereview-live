import { planLimits } from './features';

const formatBytes = (bytes: number) => {
	const gb = bytes / (1024 * 1024 * 1024);
	return `${gb}GB`;
};

const formatNumber = (num: number) => {
	return num.toLocaleString();
};

export const plans = {
	free: {
		id: 'free' as const,
		name: 'Free',
		price: { stripe: 0, paystack: 0 },
		limits: {
			localReviews: planLimits.free.localReviews,
			cloudSync: false,
			storage: formatBytes(planLimits.free.maxStorageBytes),
			aiCredits: planLimits.free.aiCreditsPerMonth,
			teamMembers: planLimits.free.maxTeamMembers
		},
		features: [
			`${planLimits.free.localReviews} local reviews`,
			'Unlimited Public Repos',
			`${planLimits.free.maxProjects} Private Repos`,
			'100 Video Minutes/mo',
			'Basic AI Analysis',
			'Community support'
		]
	},
	pro: {
		id: 'pro' as const,
		name: 'Pro',
		price: { stripe: 20, paystack: 8000 },
		limits: {
			localReviews: planLimits.pro.localReviews,
			cloudSync: true,
			storage: formatBytes(planLimits.pro.maxStorageBytes),
			aiCredits: planLimits.pro.aiCreditsPerMonth,
			teamMembers: planLimits.pro.maxTeamMembers
		},
		features: [
			'Unlimited local reviews',
			'Unlimited cloud sync',
			'Unlimited Repos',
			'Unlimited Video Minutes',
			`${formatBytes(planLimits.pro.maxStorageBytes)} storage`,
			`${formatNumber(planLimits.pro.aiCreditsPerMonth)} AI credits/month`,
			'Advanced AI (GPT-4)',
			'Priority Support',
			'P2P Transfer Priority'
		]
	},
	team: {
		id: 'team' as const,
		name: 'Team',
		price: { stripe: 50, paystack: 20000 },
		limits: {
			localReviews: planLimits.team.localReviews,
			cloudSync: true,
			storage: formatBytes(planLimits.team.maxStorageBytes),
			aiCredits: planLimits.team.aiCreditsPerMonth,
			teamMembers: planLimits.team.maxTeamMembers
		},
		features: [
			'Everything in Pro',
			`${formatBytes(planLimits.team.maxStorageBytes)} storage`,
			`${formatNumber(planLimits.team.aiCreditsPerMonth)} AI credits/month`,
			`Up to ${planLimits.team.maxTeamMembers} team members`,
			'SSO & SAML',
			'Audit Logs',
			'Analytics dashboard',
			'Dedicated Success Manager',
			'On-Premise Option'
		]
	}
};

export type PlanId = keyof typeof plans;
export type Plan = (typeof plans)[PlanId];
