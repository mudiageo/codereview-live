
import type { RequestHandler } from './$types';
import { GitHubImporter } from '#lib/utils/github-import.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code } = await request.json();

		if (!code) {
			return Response.json({ error: 'Authorization code is required' }, { status: 400 });
		}

		const clientId = process.env.GITHUB_CLIENT_ID;
		const clientSecret = process.env.GITHUB_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			return Response.json(
				{ error: 'GitHub OAuth is not configured' },
				{ status: 500 }
			);
		}

		const accessToken = await GitHubImporter.getAccessToken(code, clientId, clientSecret);

		return Response.json({ accessToken });
	} catch (error) {
		console.error('Failed to exchange token:', error);
		return Response.json(
			{ error: 'Failed to exchange token' },
			{ status: 500 }
		);
	}
};
