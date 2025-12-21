import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GitHubImporter } from '$lib/utils/github-import';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code } = await request.json();

		if (!code) {
			return json({ error: 'Authorization code is required' }, { status: 400 });
		}

		const clientId = process.env.GITHUB_CLIENT_ID;
		const clientSecret = process.env.GITHUB_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			return json(
				{ error: 'GitHub OAuth is not configured' },
				{ status: 500 }
			);
		}

		const accessToken = await GitHubImporter.getAccessToken(code, clientId, clientSecret);

		return json({ accessToken });
	} catch (error) {
		console.error('Failed to exchange token:', error);
		return json(
			{ error: 'Failed to exchange token' },
			{ status: 500 }
		);
	}
};
