import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeTransaction } from '$lib/server/payments/paystack';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is authenticated
		const session = await locals.auth();
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { amount, plan } = await request.json();

		if (!amount || !plan) {
			return json({ error: 'Amount and plan are required' }, { status: 400 });
		}

		const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
		const callbackUrl = `${publicAppUrl}/api/paystack/verify`;

		const transaction = await initializeTransaction({
			userId: session.user.id,
			email: session.user.email,
			amount: amount * 100, // Convert to kobo
			plan,
			callbackUrl
		});

		return json({
			authorizationUrl: transaction.authorization_url,
			accessCode: transaction.access_code,
			reference: transaction.reference
		});
	} catch (error) {
		console.error('Failed to initialize transaction:', error);
		return json(
			{ error: 'Failed to initialize transaction' },
			{ status: 500 }
		);
	}
};
