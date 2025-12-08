import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!stripeSecretKey) {
	console.warn('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
	apiVersion: '2024-11-20.acacia'
});

export interface CheckoutSessionParams {
	userId: string;
	priceId: string;
	successUrl: string;
	cancelUrl: string;
	customerEmail?: string;
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(params: CheckoutSessionParams) {
	try {
		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			payment_method_types: ['card'],
			line_items: [
				{
					price: params.priceId,
					quantity: 1
				}
			],
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
			customer_email: params.customerEmail,
			metadata: {
				userId: params.userId
			}
		});

		return session;
	} catch (error) {
		console.error('Failed to create checkout session:', error);
		throw new Error('Failed to create checkout session');
	}
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
	try {
		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: returnUrl
		});

		return session;
	} catch (error) {
		console.error('Failed to create portal session:', error);
		throw new Error('Failed to create portal session');
	}
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(payload: string | Buffer, signature: string) {
	try {
		const event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);

		return event;
	} catch (error) {
		console.error('Webhook signature verification failed:', error);
		throw new Error('Webhook signature verification failed');
	}
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
	try {
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		return subscription;
	} catch (error) {
		console.error('Failed to retrieve subscription:', error);
		throw new Error('Failed to retrieve subscription');
	}
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
	try {
		const subscription = await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: cancelAtPeriodEnd
		});

		return subscription;
	} catch (error) {
		console.error('Failed to cancel subscription:', error);
		throw new Error('Failed to cancel subscription');
	}
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string) {
	try {
		const customer = await stripe.customers.retrieve(customerId);
		return customer;
	} catch (error) {
		console.error('Failed to retrieve customer:', error);
		throw new Error('Failed to retrieve customer');
	}
}

/**
 * Create a new customer
 */
export async function createCustomer(email: string, userId: string) {
	try {
		const customer = await stripe.customers.create({
			email,
			metadata: {
				userId
			}
		});

		return customer;
	} catch (error) {
		console.error('Failed to create customer:', error);
		throw new Error('Failed to create customer');
	}
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(subscriptionId: string) {
	try {
		const subscription = await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: false
		});

		return subscription;
	} catch (error) {
		console.error('Failed to resume subscription:', error);
		throw new Error('Failed to resume subscription');
	}
}
