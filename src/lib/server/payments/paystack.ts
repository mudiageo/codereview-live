import { config } from '../config'

const paystackSecretKey = config.payments.paystack.secretKey;
const paystackWebhookSecret = config.payments.paystack.webhookSecret;

if (!paystackSecretKey) {
	console.warn('PAYSTACK_SECRET_KEY is not set');
}

const PAYSTACK_API_BASE = 'https://api.paystack.co';

export interface InitializeTransactionParams {
	userId: string;
	email: string;
	amount: number; // in kobo (NGN cents)
	plan: string;
	callbackUrl: string;
}

/**
 * Initialize a Paystack transaction
 */
export async function initializeTransaction(params: InitializeTransactionParams) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: params.email,
				amount: params.amount,
				callback_url: params.callbackUrl,
				metadata: {
					userId: params.userId,
					plan: params.plan
				}
			})
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to initialize transaction');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to initialize transaction:', error);
		throw new Error('Failed to initialize transaction');
	}
}

/**
 * Verify a Paystack transaction
 */
export async function verifyTransaction(reference: string) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${reference}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			}
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to verify transaction');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to verify transaction:', error);
		throw new Error('Failed to verify transaction');
	}
}

/**
 * Handle Paystack webhook events
 */
export async function handleWebhook(payload: string, signature: string): Promise<any> {
	try {
		// Verify webhook signature
		const crypto = await import('crypto');
		const hash = crypto
			.createHmac('sha512', paystackWebhookSecret)
			.update(payload)
			.digest('hex');

		if (hash !== signature) {
			throw new Error('Invalid webhook signature');
		}

		const event = JSON.parse(payload);
		return event;
	} catch (error) {
		console.error('Webhook verification failed:', error);
		throw new Error('Webhook verification failed');
	}
}

/**
 * Create a subscription on Paystack
 */
export async function createSubscription(params: {
	customer: string;
	plan: string;
	authorization: string;
}) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/subscription`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to create subscription');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to create subscription:', error);
		throw new Error('Failed to create subscription');
	}
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionCode: string) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/subscription/${subscriptionCode}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			}
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to retrieve subscription');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to retrieve subscription:', error);
		throw new Error('Failed to retrieve subscription');
	}
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionCode: string, token: string) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/subscription/disable`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				code: subscriptionCode,
				token
			})
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to cancel subscription');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to cancel subscription:', error);
		throw new Error('Failed to cancel subscription');
	}
}

/**
 * Enable a subscription
 */
export async function enableSubscription(subscriptionCode: string, token: string) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/subscription/enable`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				code: subscriptionCode,
				token
			})
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to enable subscription');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to enable subscription:', error);
		throw new Error('Failed to enable subscription');
	}
}

/**
 * Create a customer
 */
export async function createCustomer(email: string, firstName: string, lastName: string) {
	try {
		const response = await fetch(`${PAYSTACK_API_BASE}/customer`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${paystackSecretKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email,
				first_name: firstName,
				last_name: lastName
			})
		});

		const data = await response.json();

		if (!data.status) {
			throw new Error(data.message || 'Failed to create customer');
		}

		return data.data;
	} catch (error) {
		console.error('Failed to create customer:', error);
		throw new Error('Failed to create customer');
	}
}
