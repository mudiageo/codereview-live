import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyTransaction } from '$lib/server/payments/paystack';
import { db } from '$lib/server/db';
import { subscriptions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const reference = url.searchParams.get('reference');

		if (!reference) {
			throw redirect(303, '/settings/billing?error=missing_reference');
		}

		// Verify the transaction
		const transaction = await verifyTransaction(reference);

		if (transaction.status !== 'success') {
			throw redirect(303, '/settings/billing?error=payment_failed');
		}

		// Get user from metadata
		const userId = transaction.metadata?.userId;
		const plan = transaction.metadata?.plan;

		if (!userId || !plan) {
			throw redirect(303, '/settings/billing?error=invalid_metadata');
		}

		// Check if user is authenticated and matches
		const session = await locals.auth();
		if (!session?.user || session.user.id !== userId) {
			throw redirect(303, '/login?redirect=/settings/billing');
		}

		// Update user and subscription
		await db
			.update(users)
			.set({
				plan,
				paystackCustomerId: transaction.customer?.id
			})
			.where(eq(users.id, userId));

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

		throw redirect(303, `/settings/billing?success=true&plan=${plan}`);
	} catch (error) {
		if (error instanceof Response) {
			throw error;
		}

		console.error('Failed to verify transaction:', error);
		throw redirect(303, '/settings/billing?error=verification_failed');
	}
};
