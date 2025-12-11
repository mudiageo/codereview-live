import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCheckoutSession } from '$lib/server/payments/stripe';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is authenticated
		const session = await locals.auth();
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { priceId, plan } = await request.json();

		if (!priceId) {
			return json({ error: 'Price ID is required' }, { status: 400 });
		}

		const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
		const successUrl = `${publicAppUrl}/settings/billing?success=true&plan=${plan}`;
		const cancelUrl = `${publicAppUrl}/settings/billing?canceled=true`;

		const checkoutSession = await createCheckoutSession({
			userId: session.user.id,
			priceId,
			successUrl,
			cancelUrl,
			customerEmail: session.user.email
		});

		return json({ url: checkoutSession.url });
	} catch (error) {
		console.error('Failed to create checkout session:', error);
		return json(
			{ error: 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
};
