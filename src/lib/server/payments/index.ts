/**
 * Unified payment provider interface
 */

export { stripe } from './stripe';
export * as stripeService from './stripe';
export * as paystackService from './paystack';

import type { PlanId } from '$lib/config/plans';

export type PaymentProvider = 'stripe' | 'paystack';

export interface SubscriptionData {
	userId: string;
	plan: PlanId;
	provider: PaymentProvider;
	subscriptionId: string;
	customerId: string;
	status: 'active' | 'cancelled' | 'expired' | 'trialing';
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
}

/**
 * Get subscription status from provider
 */
export async function getProviderSubscription(
	provider: PaymentProvider,
	subscriptionId: string
): Promise<any> {
	if (provider === 'stripe') {
		const { getSubscription } = await import('./stripe');
		return getSubscription(subscriptionId);
	} else if (provider === 'paystack') {
		const { getSubscription } = await import('./paystack');
		return getSubscription(subscriptionId);
	}

	throw new Error(`Unsupported payment provider: ${provider}`);
}

/**
 * Cancel subscription with provider
 */
export async function cancelProviderSubscription(
	provider: PaymentProvider,
	subscriptionId: string,
	token?: string
): Promise<any> {
	if (provider === 'stripe') {
		const { cancelSubscription } = await import('./stripe');
		return cancelSubscription(subscriptionId);
	} else if (provider === 'paystack') {
		if (!token) {
			throw new Error('Token required for Paystack subscription cancellation');
		}
		const { cancelSubscription } = await import('./paystack');
		return cancelSubscription(subscriptionId, token);
	}

	throw new Error(`Unsupported payment provider: ${provider}`);
}
