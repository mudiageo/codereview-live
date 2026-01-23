export const plans = {
	free: {
		id: 'free' as const,
		name: 'Free',
		price: { stripe: 0, paystack: 0 },
		limits: {
			localReviews: 10,
			cloudSync: false,
			storage: '1GB',
			aiCredits: 5000,
			teamMembers: 1
		},
		features: [
			'Unlimited Public Repos',
			'5 Private Repos',
			'100 Video Minutes/mo',
			'Basic AI Analysis'
		]
	},
	pro: {
		id: 'pro' as const,
		name: 'Pro',
		price: { stripe: 20, paystack: 8000 },
		limits: {
			localReviews: -1, // unlimited
			cloudSync: true,
			storage: '50GB',
			aiCredits: 50000,
			teamMembers: 1
		},
		features: [
			'Unlimited Repos',
			'Unlimited Video Minutes',
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
			localReviews: -1,
			cloudSync: true,
			storage: '200GB',
			aiCredits: 500000,
			teamMembers: 10
		},
		features: [
			'Everything in Pro',
			'SSO & SAML',
			'Audit Logs',
			'Dedicated Success Manager',
			'On-Premise Option'
		]
	}
};

export type PlanId = keyof typeof plans;
export type Plan = (typeof plans)[PlanId];
