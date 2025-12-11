export const plans = {
	free: {
		id: 'free' as const,
		name: 'Free',
		price: { stripe: 0, paystack: 0 },
		limits: {
			localReviews: 10,
			cloudSync: false,
			storage: '1GB',
			aiCredits: 50,
			teamMembers: 1
		},
		features: ['10 local reviews', 'Basic features', 'Community support']
	},
	pro: {
		id: 'pro' as const,
		name: 'Pro',
		price: { stripe: 20, paystack: 8000 },
		limits: {
			localReviews: -1, // unlimited
			cloudSync: true,
			storage: '50GB',
			aiCredits: 1000,
			teamMembers: 1
		},
		features: [
			'Unlimited local reviews',
			'Unlimited cloud sync',
			'50GB storage',
			'1,000 AI credits/month',
			'Advanced AI features',
			'Priority support'
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
			aiCredits: 5000,
			teamMembers: 10
		},
		features: [
			'Everything in Pro',
			'200GB storage',
			'5,000 AI credits/month',
			'Up to 10 team members',
			'SSO & Admin controls',
			'Analytics dashboard',
			'Priority support'
		]
	}
};

export type PlanId = keyof typeof plans;
export type Plan = (typeof plans)[PlanId];
