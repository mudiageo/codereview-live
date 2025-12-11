import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleWebhook } from '$lib/server/payments/stripe';
import { db } from '$lib/server/db';
import { subscriptions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature');

		if (!signature) {
			return json({ error: 'No signature provided' }, { status: 400 });
		}

		const event = await handleWebhook(body, signature);

		// Handle different event types
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				const userId = session.metadata?.userId;
				const customerId = session.customer as string;
				const subscriptionId = session.subscription as string;

				if (userId && subscriptionId) {
					// Update user with customer ID
					await db
						.update(users)
						.set({ stripeCustomerId: customerId })
						.where(eq(users.id, userId));

					// Create or update subscription record
					const existingSub = await db.query.subscriptions.findFirst({
						where: eq(subscriptions.userId, userId)
					});

					if (existingSub) {
						await db
							.update(subscriptions)
							.set({
								stripeSubscriptionId: subscriptionId,
								status: 'active',
								updatedAt: new Date()
							})
							.where(eq(subscriptions.userId, userId));
					} else {
						await db.insert(subscriptions).values({
							userId,
							plan: 'pro', // Default, will be updated by subscription.updated
							status: 'active',
							stripeSubscriptionId: subscriptionId
						});
					}
				}
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object;
				const customerId = subscription.customer as string;

				// Find user by customer ID
				const user = await db.query.users.findFirst({
					where: eq(users.stripeCustomerId, customerId)
				});

				if (user) {
					const status = subscription.status === 'active' ? 'active' : 'cancelled';

					await db
						.update(subscriptions)
						.set({
							status,
							currentPeriodStart: new Date(subscription.current_period_start * 1000),
							currentPeriodEnd: new Date(subscription.current_period_end * 1000),
							cancelAtPeriodEnd: subscription.cancel_at_period_end,
							updatedAt: new Date()
						})
						.where(eq(subscriptions.userId, user.id));
				}
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object;
				const customerId = subscription.customer as string;

				const user = await db.query.users.findFirst({
					where: eq(users.stripeCustomerId, customerId)
				});

				if (user) {
					await db
						.update(subscriptions)
						.set({
							status: 'expired',
							updatedAt: new Date()
						})
						.where(eq(subscriptions.userId, user.id));

					// Downgrade user to free plan
					await db
						.update(users)
						.set({ plan: 'free' })
						.where(eq(users.id, user.id));
				}
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object;
				const customerId = invoice.customer as string;

				const user = await db.query.users.findFirst({
					where: eq(users.stripeCustomerId, customerId)
				});

				if (user) {
					// Payment succeeded, ensure subscription is active
					await db
						.update(subscriptions)
						.set({
							status: 'active',
							updatedAt: new Date()
						})
						.where(eq(subscriptions.userId, user.id));
				}
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object;
				const customerId = invoice.customer as string;

				const user = await db.query.users.findFirst({
					where: eq(users.stripeCustomerId, customerId)
				});

				if (user) {
					// Payment failed, mark subscription accordingly
					await db
						.update(subscriptions)
						.set({
							status: 'expired',
							updatedAt: new Date()
						})
						.where(eq(subscriptions.userId, user.id));
				}
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
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
