import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleWebhook } from '$lib/server/payments/paystack';
import { db } from '$lib/server/db';
import { subscriptions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		const signature = request.headers.get('x-paystack-signature');

		if (!signature) {
			return json({ error: 'No signature provided' }, { status: 400 });
		}

		const event = await handleWebhook(body, signature);

		// Handle different event types
		switch (event.event) {
			case 'charge.success': {
				const data = event.data;
				const userId = data.metadata?.userId;
				const plan = data.metadata?.plan;
				const customerId = data.customer?.id;

				if (userId && plan) {
					// Update user with customer ID
					await db
						.update(users)
						.set({ paystackCustomerId: customerId })
						.where(eq(users.id, userId));

					// Create or update subscription record
					const existingSub = await db.query.subscriptions.findFirst({
						where: eq(subscriptions.userId, userId)
					});

					if (existingSub) {
						await db
							.update(subscriptions)
							.set({
								plan,
								status: 'active',
								updatedAt: new Date()
							})
							.where(eq(subscriptions.userId, userId));
					} else {
						await db.insert(subscriptions).values({
							userId,
							plan,
							status: 'active'
						});
					}

					// Update user plan
					await db
						.update(users)
						.set({ plan })
						.where(eq(users.id, userId));
				}
				break;
			}

			case 'subscription.create': {
				const data = event.data;
				const customerId = data.customer?.id;
				const subscriptionCode = data.subscription_code;

				if (customerId) {
					const user = await db.query.users.findFirst({
						where: eq(users.paystackCustomerId, customerId)
					});

					if (user) {
						await db
							.update(subscriptions)
							.set({
								paystackSubscriptionId: subscriptionCode,
								status: 'active',
								updatedAt: new Date()
							})
							.where(eq(subscriptions.userId, user.id));
					}
				}
				break;
			}

			case 'subscription.disable': {
				const data = event.data;
				const subscriptionCode = data.subscription_code;

				const subscription = await db.query.subscriptions.findFirst({
					where: eq(subscriptions.paystackSubscriptionId, subscriptionCode)
				});

				if (subscription) {
					await db
						.update(subscriptions)
						.set({
							status: 'cancelled',
							updatedAt: new Date()
						})
						.where(eq(subscriptions.id, subscription.id));

					// Downgrade user to free plan
					await db
						.update(users)
						.set({ plan: 'free' })
						.where(eq(users.id, subscription.userId));
				}
				break;
			}

			case 'invoice.update': {
				const data = event.data;
				const subscriptionCode = data.subscription?.subscription_code;

				if (subscriptionCode) {
					const subscription = await db.query.subscriptions.findFirst({
						where: eq(subscriptions.paystackSubscriptionId, subscriptionCode)
					});

					if (subscription) {
						const status = data.paid ? 'active' : 'expired';

						await db
							.update(subscriptions)
							.set({
								status,
								updatedAt: new Date()
							})
							.where(eq(subscriptions.id, subscription.id));
					}
				}
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.event}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json(
			{ error: 'Webhook processing failed' },
			{ status: 400 }
		);
	}
};
